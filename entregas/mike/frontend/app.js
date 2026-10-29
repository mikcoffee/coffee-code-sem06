// Orchestrates the page: connects the API layer with the UI layer.
import * as api from "./api.js";
import * as ui from "./ui.js";

const PAGE_SIZE = 4;

const state = {
  search: "",
  subjectId: "",
  page: 1,
  total: 0,
  subjectNames: new Map(),
  editingId: null,
};

function handleError(error) {
  if (error instanceof api.NetworkError) {
    ui.showApiStatus("offline");
    ui.showMessage(error.message, "error");
  } else if (error instanceof api.HttpError) {
    ui.showMessage(`The API responded with code ${error.status}.`, "error");
  } else {
    console.error(error);
    ui.showMessage("Something unexpected happened. See the console.", "error");
  }
}

let lastRequest = 0; // numbers list requests to discard delayed responses

async function loadGroups() {
  const number = ++lastRequest;
  ui.showMessage("Loading...");
  
  try {
    const { groups, total } = await api.listGroups({
      search: state.search,
      subjectId: state.subjectId,
      limit: PAGE_SIZE,
      offset: (state.page - 1) * PAGE_SIZE,
    });
    
    if (number !== lastRequest) return; // a newer request exists: this response is old
    
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > totalPages) {
      // the requested page no longer exists (for example, its last item was deleted)
      state.page = totalPages;
      return loadGroups();
    }
    
    state.total = total;
    ui.showApiStatus("connected");
    ui.renderGroups(groups, state.subjectNames, { onEdit: startEditing, onDelete: deleteGroup });
    ui.renderPagination({ page: state.page, totalPages, total });
    ui.showMessage("");
  } catch (error) {
    if (number !== lastRequest) return;
    handleError(error);
  }
}

function startEditing(group) {
  state.editingId = group.group_id;
  ui.clearErrors();
  ui.fillForm(group);
}

function cancelEditing() {
  state.editingId = null;
  ui.clearForm();
}

async function deleteGroup(group) {
  if (!window.confirm(`Delete the group "${group.group_name}"?`)) return;
  
  try {
    await api.deleteGroup(group.group_id);
    if (state.editingId === group.group_id) cancelEditing();
    await loadGroups();
    ui.showMessage("Group deleted.");
  } catch (error) {
    if (error instanceof api.HttpError && error.status === 404) {
      ui.showMessage("This group no longer exists. The list was updated.", "error");
      await loadGroups();
    } else {
      handleError(error);
    }
  }
}

function showValidationErrors(detail) {
  for (const problem of detail) {
    const field = problem.loc[problem.loc.length - 1]; // ["body", "group_name"] -> "group_name"
    ui.showFieldError(field, problem.msg);
  }
  ui.showMessage("Fix the indicated fields.", "error");
}

async function save(event) {
  event.preventDefault();
  ui.clearErrors();
  ui.lockForm(true);
  
  const body = ui.readForm();
  
  try {
    let message;
    if (state.editingId === null) {
      await api.createGroup(body);
      message = "Group created.";
    } else {
      await api.updateGroup(state.editingId, body);
      message = "Group updated.";
    }
    
    cancelEditing();
    await loadGroups();
    ui.showMessage(message); // after reloading, because loadGroups clears the message
  } catch (error) {
    if (error instanceof api.HttpError && error.status === 422) {
      if (Array.isArray(error.body?.detail)) {
        showValidationErrors(error.body.detail);
      } else {
        ui.showMessage(error.body?.detail ?? "Invalid data.", "error");
      }
    } else if (error instanceof api.HttpError && error.status === 409) {
      ui.showFieldError("group_name", "A group with this name already exists in this subject.");
      ui.showMessage("Conflict: choose another name.", "error");
    } else if (error instanceof api.HttpError && error.status === 404) {
      ui.showMessage("This group no longer exists.", "error");
      cancelEditing();
      await loadGroups();
    } else {
      handleError(error);
    }
  } finally {
    ui.lockForm(false);
  }
}

function withDelay(func, milliseconds) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), milliseconds);
  };
}

export async function start() {
  const el = ui.elements();
  
  el.form.addEventListener("submit", save);
  el.cancel.addEventListener("click", cancelEditing);
  
  el.previous.addEventListener("click", () => {
    state.page -= 1;
    loadGroups();
  });
  
  el.next.addEventListener("click", () => {
    state.page += 1;
    loadGroups();
  });
  
  el.search.addEventListener("input", withDelay(() => {
    state.search = el.search.value.trim();
    state.page = 1;
    loadGroups();
  }, 300));
  
  el.subjectFilter.addEventListener("change", () => {
    state.subjectId = el.subjectFilter.value;
    state.page = 1;
    loadGroups();
  });
  
  try {
    const subjects = await api.listSubjects();
    state.subjectNames = new Map(subjects.map((s) => [s.subject_id, s.name]));
    ui.fillSubjects(subjects);
  } catch (error) {
    handleError(error);
    return;
  }
  
  await loadGroups();
}

start();
