// UI layer: reads and writes the page. No fetch here.
const $ = (id) => document.getElementById(id);

const FIELD_ERROR_MAP = {
  group_name: "error-name",
  subject_id: "error-subject",
  max_participants: "error-limit",
  description: "error-description",
};

export function showApiStatus(status) {
  const el = $("api-status");
  el.dataset.status = status;
  el.textContent = status === "connected" ? "API connected" : "API offline";
}

export function showMessage(text, type = "info") {
  const el = $("message");
  el.textContent = text;
  el.dataset.type = type;
}

export function fillSubjects(subjects) {
  for (const id of ["subject-filter", "subject"]) {
    const select = $(id);
    const first = id === "subject-filter" ? [select.options[0]] : [];
    select.replaceChildren(...first);
    for (const m of subjects) {
      const option = document.createElement("option");
      option.value = m.subject_id;
      option.textContent = m.name;
      select.append(option);
    }
  }
}

export function renderGroups(groups, subjectNames, { onEdit, onDelete }) {
  const list = $("groups-list");
  list.replaceChildren();
  if (groups.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No groups found.";
    list.append(empty);
    return;
  }
  for (const g of groups) {
    const item = document.createElement("li");
    item.className = "card";
    const title = document.createElement("h3");
    title.textContent = g.group_name;
    const subject = document.createElement("p");
    subject.className = "subject";
    subject.textContent = subjectNames.get(g.subject_id) ?? `Subject ${g.subject_id}`;
    const limit = document.createElement("p");
    limit.textContent = `Up to ${g.max_participants} participants`;
    item.append(title, subject, limit);
    if (g.description) {
      const description = document.createElement("p");
      description.textContent = g.description;
      item.append(description);
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => onEdit(g));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "secondary";
    del.textContent = "Delete";
    del.addEventListener("click", () => onDelete(g));
    actions.append(edit, del);
    item.append(actions);
    list.append(item);
  }
}

export function renderPagination({ page, totalPages, total }) {
  const groupsWord = total === 1 ? "group" : "groups";
  $("current-page").textContent =
    `Page ${page} of ${totalPages} (${total} ${groupsWord})`;
  $("previous").disabled = page <= 1;
  $("next").disabled = page >= totalPages;
}

export function readForm() {
  const description = $("description").value.trim();
  return {
    group_name: $("name").value.trim(),
    subject_id: Number($("subject").value),
    max_participants: Number($("limit").value),
    description: description === "" ? null : description,
  };
}

export function fillForm(g) {
  $("name").value = g.group_name;
  $("subject").value = g.subject_id;
  $("limit").value = g.max_participants;
  $("description").value = g.description ?? "";
  $("form-title").textContent = "Edit group";
  $("cancel").hidden = false;
}

export function clearForm() {
  $("group-form").reset();
  $("limit").value = 10;
  $("form-title").textContent = "New group";
  $("cancel").hidden = true;
  clearErrors();
}

export function clearErrors() {
  for (const id of Object.values(FIELD_ERROR_MAP)) $(id).textContent = "";
}

export function showFieldError(field, text) {
  const id = FIELD_ERROR_MAP[field];
  if (id) $(id).textContent = text;
}

export function lockForm(locked) {
  $("save").disabled = locked;
}

export function elements() {
  return {
    search: $("search"),
    subjectFilter: $("subject-filter"),
    form: $("group-form"),
    previous: $("previous"),
    next: $("next"),
    cancel: $("cancel"),
  };
}
