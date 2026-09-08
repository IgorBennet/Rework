const STORE = "rework-prototype-v3";
const LEGACY_STORE = "rework-prototype-v2";

// Dados iniciais usados quando ainda não existem ocorrências salvas.
const seed = [
  {
    id: "RW-026",
    date: "02/09/2026",
    line: "VM02",
    part: "Inspeção final",
    defect: "Fricção",
    description: "Marcas de fricção identificadas na inspeção.",
    serialStart: "Y5UX3X3L006200",
    serialEnd: "Y5UX3X3L006899",
    blocked: 700,
    model: "UN50M75HAGXZD",
    area: "Qualidade",
    detected: 8,
    classification: "Processo",
    department: "Engenharia Mecânica",
    person: "Marina Costa",
    cause: "Possível desalinhamento do dispositivo.",
    method:
      "Limpar a área, inspecionar sob luz padrão e substituir a proteção quando houver marca.",
    status: "Iniciado",
    containerHourlyCost: 35,
    salesDelayHourlyCost: 120,
    containers: [
      { id: "CT-VM02-014", qty: 400 },
      { id: "CT-VM02-015", qty: 300 },
    ],
    scans: [
      { serial: "Y5UX3X3L006205", result: "OK", at: "02/09/2026 14:26" },
      { serial: "Y5UX3X3L006204", result: "NG", at: "02/09/2026 14:25" },
    ],
  },
  {
    id: "RW-025",
    date: "01/09/2026",
    line: "VM01",
    part: "Montagem",
    defect: "Folga",
    description: "Folga acima do padrão na tampa traseira.",
    serialStart: "A10000",
    serialEnd: "A10499",
    blocked: 500,
    model: "UN55CU8000",
    area: "Produção",
    detected: 4,
    classification: "Material",
    department: "Engenharia de Produto",
    person: "Carlos Lima",
    cause: "",
    method: "",
    status: "Pendente",
    containerHourlyCost: 25,
    salesDelayHourlyCost: 80,
    containers: [{ id: "CT-VM01-008", qty: 500 }],
    scans: [],
  },
  {
    id: "RW-024",
    date: "31/08/2026",
    line: "VM04",
    part: "Embalagem",
    defect: "Risco",
    description: "Sheet riscado durante movimentação.",
    serialStart: "B24001",
    serialEnd: "B24112",
    blocked: 112,
    model: "UN43T5300",
    area: "Logística",
    detected: 3,
    classification: "Manuseio",
    department: "Qualidade",
    person: "Ana Souza",
    cause: "Contato com guia lateral.",
    method:
      "Inspecionar superfície; limpar marcas leves e segregar peças com risco permanente.",
    status: "Finalizado",
    containerHourlyCost: 12,
    salesDelayHourlyCost: 40,
    containers: [{ id: "CT-VM04-003", qty: 112 }],
    scans: [{ serial: "B24001", result: "OK", at: "31/08/2026 15:10" }],
  },
];

// Leitura, migração e gravação dos dados locais do protótipo.
const cloneSeed = () => JSON.parse(JSON.stringify(seed));
const normalize = (data) =>
  data.map((occurrence) => ({
    ...occurrence,
    createdAt: occurrence.createdAt || `${toIsoDate(occurrence.date)}T00:00:00`,
    resolvedAt:
      occurrence.resolvedAt ||
      (occurrence.status === "Finalizado"
        ? `${toIsoDate(occurrence.date)}T23:59:59`
        : null),
    containerHourlyCost: Number(occurrence.containerHourlyCost || 0),
    salesDelayHourlyCost: Number(occurrence.salesDelayHourlyCost || 0),
  }));
const read = () => {
  try {
    const current = localStorage.getItem(STORE);
    const legacy = localStorage.getItem(LEGACY_STORE);
    if (current) {
      const data = JSON.parse(current);
      if (legacy && !localStorage.getItem("rework-v2-migrated")) {
        const previous = JSON.parse(legacy);
        data.forEach((occurrence) => {
          const oldOccurrence = previous.find(
            (item) => item.id === occurrence.id,
          );
          if (!oldOccurrence) return;
          ["method", "cause", "classification", "department", "person"].forEach(
            (key) => {
              if (!occurrence[key] && oldOccurrence[key])
                occurrence[key] = oldOccurrence[key];
            },
          );
        });
        localStorage.setItem(STORE, JSON.stringify(data));
        localStorage.setItem("rework-v2-migrated", "true");
      }
      return normalize(data);
    }
    if (legacy) {
      const migrated = JSON.parse(legacy);
      localStorage.setItem(STORE, JSON.stringify(migrated));
      return normalize(migrated);
    }
    return normalize(cloneSeed());
  } catch {
    return normalize(cloneSeed());
  }
};
const save = (data) => localStorage.setItem(STORE, JSON.stringify(data));
// Funções auxiliares compartilhadas por todas as telas.
const selected = () =>
  new URLSearchParams(location.search).get("id") ||
  localStorage.getItem("rework-selected") ||
  "RW-026";
const choose = (id) => localStorage.setItem("rework-selected", id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
const num = (value) => Number(value || 0).toLocaleString("pt-BR");
const inspected = (occurrence) => occurrence.scans.length;
const defects = (occurrence) =>
  occurrence.scans.filter((scan) => scan.result === "NG").length;
const pending = (occurrence) =>
  Math.max(occurrence.blocked - inspected(occurrence), 0);
const flow = (occurrence) => (occurrence.method ? "Definido" : "Pendente");
const params = (id) => `?id=${encodeURIComponent(id)}`;
const toIsoDate = (date) => date.split("/").reverse().join("-");
const fromIsoDate = (date) => date.split("-").reverse().join("/");
const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const blockedHours = (occurrence) => {
  const end = occurrence.resolvedAt
    ? new Date(occurrence.resolvedAt).getTime()
    : Date.now();
  return Math.max(
    (end - new Date(occurrence.createdAt).getTime()) / 3600000,
    0,
  );
};
const hourlyCost = (occurrence) =>
  Number(occurrence.containerHourlyCost || 0) +
  Number(occurrence.salesDelayHourlyCost || 0);
const accumulatedCost = (occurrence) =>
  hourlyCost(occurrence) * blockedHours(occurrence);
const priority = (occurrence) => {
  const cost = accumulatedCost(occurrence);
  const hours = blockedHours(occurrence);
  if (hourlyCost(occurrence) > 0) {
    if (cost >= 5000) return { level: "high", label: "Alta", icon: "▲" };
    if (cost >= 1000) return { level: "medium", label: "Média", icon: "◆" };
    return { level: "low", label: "Baixa", icon: "●" };
  }
  if (occurrence.blocked >= 1000 || hours >= 72)
    return { level: "high", label: "Alta", icon: "▲" };
  if (occurrence.blocked >= 300 || hours >= 24)
    return { level: "medium", label: "Média", icon: "◆" };
  return { level: "low", label: "Baixa", icon: "●" };
};
const costPriorityCell = (occurrence) => {
  const itemPriority = priority(occurrence);
  const en = preferenceLanguage() === "en";
  const priorityLabels = { low: "Low", medium: "Medium", high: "High" };
  const value =
    hourlyCost(occurrence) > 0
      ? money(accumulatedCost(occurrence))
      : en
        ? "Cost not provided"
        : "Custo não informado";
  const hoursLabel = en ? "stopped" : "parado";
  const priorityLabel = en
    ? priorityLabels[itemPriority.level]
    : itemPriority.label;
  return `<div class="cost-priority"><strong>${value}</strong><small>${money(hourlyCost(occurrence))}/h · ${Math.floor(blockedHours(occurrence))}h ${hoursLabel}</small><span class="priority ${itemPriority.level}">${itemPriority.icon} ${priorityLabel}</span></div>`;
};

// Textos principais usados pela opção de idioma inglês.
const ENGLISH = {
  "Visão geral": "Overview",
  "Painel da qualidade": "Quality dashboard",
  "Visão consolidada dos bloqueios e do avanço de cada linha.":
    "Consolidated view of blocks and progress by line.",
  "Criar ocorrência": "Create occurrence",
  "Bloqueios por linha": "Blocks by line",
  "Acompanhamento operacional": "Operational tracking",
  Linha: "Line",
  Modelo: "Model",
  Data: "Date",
  Problema: "Problem",
  "Qtd. bloqueada": "Blocked qty.",
  "Qtd. pendente": "Pending qty.",
  "Qtd. defeito": "Defect qty.",
  Status: "Status",
  "Custo / prioridade": "Cost / priority",
  "Progresso geral": "Overall progress",
  "Ver todas as ocorrências": "View all occurrences",
  Ocorrências: "Occurrences",
  "Histórico de bloqueios": "Block history",
  "Buscar ocorrência ou defeito": "Search occurrence or defect",
  "Limpar filtros": "Clear filters",
  "Produto / linha": "Product / line",
  Responsável: "Owner",
  Quantidades: "Quantities",
  Ação: "Action",
  Todos: "All",
  Iniciado: "Started",
  Pendente: "Pending",
  Finalizado: "Finished",
  "Editar bloqueio": "Edit block",
  "Quantidade bloqueada": "Blocked quantity",
  "Problema / defeito": "Problem / defect",
  Descrição: "Description",
  "Pessoa responsável": "Owner",
  "Aluguel dos containers por hora (R$)": "Container rental per hour (BRL)",
  "Atraso da venda por hora (R$)": "Sales delay per hour (BRL)",
  Cancelar: "Cancel",
  "Salvar alterações": "Save changes",
  Dashboard: "Dashboard",
  Operação: "Operation",
  Gestão: "Management",
  "Usuários e perfis": "Users and profiles",
  Sair: "Sign out",
  "Acesso interno": "Internal access",
  "Acesso ao sistema": "System access",
  "E-mail": "Email",
  Senha: "Password",
  "Perfil de acesso": "Access profile",
  "Selecione seu perfil": "Select your profile",
  Qualidade: "Quality",
  Engenharia: "Engineering",
  Produção: "Production",
  Expedição: "Shipping",
  "Entrar no Rework": "Sign in",
  Mostrar: "Show",
  Ocultar: "Hide",
  "Abrir Dashboard": "Open Dashboard",
  "Acesso da Produção": "Production access",
  "Criar retrabalho": "Create rework",
  "Novo bloqueio": "New block",
  "Dados do bloqueio": "Block data",
  Continuar: "Continue",
  Voltar: "Back",
  "Criar bloqueio": "Create block",
  "Método de retrabalho": "Rework method",
  "Possível causa": "Possible cause",
  Categoria: "Category",
  "Departamento responsável": "Responsible department",
  "Containers e quantidades": "Containers and quantities",
  "Adicionar container": "Add container",
  "Bipagem de seriais": "Serial scanning",
  "Número de série": "Serial number",
  "Registrar NG": "Register NG",
  "Registrar OK": "Register OK",
  Inspecionados: "Inspected",
  Pendentes: "Pending",
  Tema: "Theme",
  Idioma: "Language",
  Sistema: "System",
  Claro: "Light",
  Escuro: "Dark",
  Português: "Portuguese",
  Inglês: "English",
  Baixa: "Low",
  Média: "Medium",
  Alta: "High",
  "Editar custos": "Edit costs",
  "Custo acumulado": "Accumulated cost",
  "Defeitos encontrados": "Defects found",
  Excluir: "Delete",
  "Serial inicial": "Initial serial",
  "Serial final": "Final serial",
  Relatórios: "Reports",
  "Relatório de ocorrências": "Occurrence report",
  "Data inicial": "Start date",
  "Data final": "End date",
  Todas: "All",
  "Gerar relatório": "Generate report",
  "Exportar CSV": "Export CSV",
  "Imprimir / salvar PDF": "Print / save PDF",
  "Ocorrências incluídas": "Included occurrences",
  Prioridade: "Priority",
  "Prioridade alta": "High priority",
  Limpar: "Clear",
};

const preferenceLanguage = () => {
  const selectedLanguage = localStorage.getItem("rework-language") || "system";
  return selectedLanguage === "system"
    ? (navigator.language || "pt-BR").toLowerCase().startsWith("en")
      ? "en"
      : "pt"
    : selectedLanguage;
};

function translatePage() {
  if (preferenceLanguage() !== "en") return;
  document.documentElement.lang = "en";
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (["SCRIPT", "STYLE"].includes(node.parentElement?.tagName)) return;
    const original = node.textContent.trim();
    if (!ENGLISH[original]) return;
    if (
      node.parentElement?.tagName === "OPTION" &&
      !node.parentElement.hasAttribute("value")
    )
      node.parentElement.value = original;
    node.textContent = node.textContent.replace(original, ENGLISH[original]);
  });
  document.querySelectorAll("[placeholder]").forEach((field) => {
    const placeholders = {
      "Digite sua senha": "Enter your password",
      "Modelo, linha, problema ou defeito": "Model, line, problem or defect",
      "Bipe ou digite o serial": "Scan or enter the serial",
    };
    if (placeholders[field.placeholder])
      field.placeholder = placeholders[field.placeholder];
  });
}

// Preferências globais: tema, idioma e menu lateral recolhido.
function initPreferences() {
  const themeSetting = localStorage.getItem("rework-theme") || "system";
  const dark =
    themeSetting === "dark" ||
    (themeSetting === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="ui-preferences" aria-label="Preferências da interface">
      <label><span>Tema</span><select id="themePreference"><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label>
      <label><span>Idioma</span><select id="languagePreference"><option value="system">Sistema</option><option value="pt">Português</option><option value="en">Inglês</option></select></label>
    </div>`,
  );
  const theme = document.querySelector("#themePreference");
  const language = document.querySelector("#languagePreference");
  theme.value = themeSetting;
  language.value = localStorage.getItem("rework-language") || "system";
  theme.onchange = () => {
    localStorage.setItem("rework-theme", theme.value);
    location.reload();
  };
  language.onchange = () => {
    localStorage.setItem("rework-language", language.value);
    location.reload();
  };
  if (localStorage.getItem("rework-sidebar") === "collapsed")
    document.body.classList.add("sidebar-collapsed");
}

const NAV_ICONS = {
  dashboard:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"/></svg>',
  occurrences:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm4 5h10v2H7v-2Zm0 4h7v2H7v-2Z"/></svg>',
  new: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6.5 1a3.5 3.5 0 1 0 0-7 5.8 5.8 0 0 1 0 7ZM2 20v-2c0-3 3.1-5 7-5s7 2 7 5v2H2Zm15.5 0v-2c0-1.6-.6-3-1.7-4 3.3.1 6.2 1.7 6.2 4v2h-4.5Z"/></svg>',
  reports:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 13h2v2H7v-2Zm0-5h2v4H7v-4Zm4 2h2v5h-2v-5Zm4-6h2v11h-2V7Z"/></svg>',
};

// Controla o login e o acesso público da Produção.
function initLogin() {
  const form = document.querySelector("#login");
  if (!form) return false;
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const status = document.querySelector("#loginStatus");
  document
    .querySelector("#togglePassword")
    ?.addEventListener("click", (event) => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      event.currentTarget.textContent = show ? "Ocultar" : "Mostrar";
    });
  document.querySelector("#publicDashboard")?.addEventListener("click", () => {
    sessionStorage.setItem("rework-profile", "Produção");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const profile = form.elements.profile.value;
    sessionStorage.setItem("rework-profile", profile);
    location.href = "dashboard.html";
  });
  return true;
}

// Monta o menu conforme as permissões do perfil ativo.
function renderShell() {
  const sidebar = document.querySelector("#sidebar");
  if (!sidebar) return;
  const active = sidebar.dataset.active;
  const profile = sessionStorage.getItem("rework-profile") || "Produção";
  const operational =
    profile === "Produção"
      ? [["dashboard", "Dashboard", "dashboard.html", "dashboard"]]
      : [
          ["dashboard", "Dashboard", "dashboard.html", "dashboard"],
          ["occurrences", "Ocorrências", "ocorrencias.html", "occurrences"],
        ];
  if (profile === "Qualidade")
    operational.push([
      "new",
      "Criar ocorrência",
      "nova-ocorrencia.html",
      "new",
    ]);
  sidebar.className = "sidebar";
  sidebar.innerHTML = `
    <div class="sidebar-head"><div class="brand-mark"><span>R</span><strong>REWORK</strong></div><button id="toggleSidebar" class="sidebar-toggle" type="button" aria-label="Recolher menu" title="Recolher menu">‹</button></div>
    <div class="nav-group"><small>Operação</small><nav>
      ${operational.map((item) => `<a class="${active === item[0] ? "active" : ""}" href="${item[2]}" title="${item[1]}"><span class="nav-icon">${NAV_ICONS[item[3]]}</span><span class="nav-label">${item[1]}</span></a>`).join("")}
    </nav></div>
    ${profile === "Qualidade" ? `<div class="nav-group"><small>Gestão</small><nav><a class="${active === "reports" ? "active" : ""}" href="relatorios.html" title="Relatórios"><span class="nav-icon">${NAV_ICONS.reports}</span><span class="nav-label">Relatórios</span></a><a class="${active === "users" ? "active" : ""}" href="usuarios.html" title="Usuários e perfis"><span class="nav-icon">${NAV_ICONS.users}</span><span class="nav-label">Usuários e perfis</span></a></nav></div>` : ""}
    <div class="sidebar-profile"><strong>Usuário ${profile}</strong><small>Perfil demonstrativo</small><button class="link-button" data-logout>Sair</button></div>`;
}

function bindGlobal() {
  const profile = sessionStorage.getItem("rework-profile") || "Produção";
  document.querySelectorAll(".quality-only").forEach((element) => {
    element.hidden = profile !== "Qualidade";
  });
  document.querySelectorAll(".occurrence-access").forEach((element) => {
    element.hidden = profile === "Produção";
  });
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.onclick = () => {
      sessionStorage.removeItem("rework-profile");
      location.href = "index.html";
    };
  });
  document.querySelector("#toggleSidebar")?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
    localStorage.setItem(
      "rework-sidebar",
      document.body.classList.contains("sidebar-collapsed")
        ? "collapsed"
        : "expanded",
    );
  });
}

function statusBadge(occurrence) {
  const style =
    occurrence.status === "Finalizado"
      ? "finished"
      : occurrence.status === "Iniciado"
        ? "started"
        : "pending";
  const labels = {
    Finalizado: "Finished",
    Iniciado: "Started",
    Pendente: "Pending",
  };
  const label =
    preferenceLanguage() === "en"
      ? labels[occurrence.status]
      : occurrence.status;
  return `<span class="badge ${style}">${esc(label)}</span>`;
}

function occurrenceActions(occurrence, profile) {
  const en = preferenceLanguage() === "en";
  if (profile === "Expedição")
    return `<button class="table-link" type="button" data-edit="${occurrence.id}">${en ? "Edit costs" : "Editar custos"}</button>`;
  if (profile === "Engenharia")
    return `<a href="metodo-retrabalho.html${params(occurrence.id)}" data-select="${occurrence.id}">${occurrence.method ? "Método / arquivo" : "Definir método"}</a>`;
  const actions = occurrence.method
    ? `<a href="seriais.html${params(occurrence.id)}" data-select="${occurrence.id}">Bipar</a><a href="metodo-retrabalho.html${params(occurrence.id)}" data-select="${occurrence.id}">Arquivo</a>`
    : `<a href="metodo-retrabalho.html${params(occurrence.id)}" data-select="${occurrence.id}">Definir método</a>`;
  return actions + (profile === "Qualidade"
    ? `<button class="danger compact-action" type="button" data-delete-occurrence="${esc(occurrence.id)}" aria-label="${en ? "Delete occurrence" : "Excluir ocorrência"} ${esc(occurrence.id)}">${en ? "Delete" : "Excluir"}</button>`
    : "");
}

// Confere o perfil novamente antes de excluir os dados locais.
function deleteOccurrence(id) {
  if (sessionStorage.getItem("rework-profile") !== "Qualidade") return false;
  const occurrence = read().find((item) => item.id === id);
  if (!occurrence) return false;
  const en = preferenceLanguage() === "en";
  if (!window.confirm(en
    ? `Delete occurrence ${id} (${occurrence.defect})? Its containers, scans and method attachment will also be deleted. This cannot be undone.`
    : `Excluir a ocorrência ${id} (${occurrence.defect})? Seus containers, bipagens e anexo do método também serão excluídos. Esta ação não pode ser desfeita.`)) return false;
  if (sessionStorage.getItem("rework-profile") !== "Qualidade") return false;
  try {
    save(read().filter((item) => item.id !== id));
  } catch {
    window.alert(en ? "Unable to delete the occurrence. Please try again." : "Não foi possível excluir a ocorrência. Tente novamente.");
    return false;
  }
  if (localStorage.getItem("rework-selected") === id)
    localStorage.removeItem("rework-selected");
  return true;
}

// Monta as linhas compactas da tabela de ocorrências.
function occurrenceRows(list) {
  const profile = sessionStorage.getItem("rework-profile") || "Produção";
  return list
    .map(
      (occurrence) => `
    <tr>
      <td>${
        profile === "Qualidade" || profile === "Expedição"
          ? `<button class="folder-button" type="button" data-edit="${occurrence.id}" aria-label="Editar ${occurrence.id}" title="Editar ${occurrence.id}">
        <span aria-hidden="true">📁</span><small>${occurrence.id}</small>
      </button>`
          : `<span class="folder-reference">📁 <small>${occurrence.id}</small></span>`
      }</td>
      <td><strong>${esc(occurrence.model)}</strong><small class="cell-detail">Linha ${esc(occurrence.line)}</small></td>
      <td>${occurrence.date}</td>
      <td class="wrap"><strong>${esc(occurrence.defect)}</strong><small class="cell-detail">${esc(occurrence.classification)} · ${esc(occurrence.area)}</small></td>
      <td>${esc(occurrence.person)}</td>
      <td><div class="quantity-stack"><span><b>${num(occurrence.blocked)}</b> bloqueadas</span><span>${num(inspected(occurrence))} inspecionadas</span><span>${num(pending(occurrence))} pendentes</span></div></td>
      <td>${statusBadge(occurrence)}<small class="cell-detail">Método ${flow(occurrence).toLowerCase()}</small></td>
      <td>${costPriorityCell(occurrence)}</td>
      <td><div class="table-actions">${occurrenceActions(occurrence, profile)}</div></td>
    </tr>`,
    )
    .join("");
}

// Aplica filtros e permite editar cada ocorrência.
function initOccurrences() {
  const body = document.querySelector("#occurrenceRows");
  if (!body) return;
  if ((sessionStorage.getItem("rework-profile") || "Produção") === "Produção") {
    location.replace("dashboard.html");
    return;
  }
  let data = read();
  const search = document.querySelector("#search");
  const date = document.querySelector("#dateFilter");
  const status = document.querySelector("#statusFilter");
  const result = document.querySelector("#filterResult");
  const dialog = document.querySelector("#editOccurrence");
  const form = document.querySelector("#editOccurrenceForm");
  const profile = sessionStorage.getItem("rework-profile") || "Produção";
  let editingId = null;

  const openEditor = (id) => {
    const occurrence = data.find((item) => item.id === id);
    if (!occurrence) return;
    editingId = id;
    document.querySelector("#editOccurrenceTitle").textContent = id;
    ["model", "line", "defect", "description", "person", "status"].forEach(
      (key) => {
        form.elements[key].value = occurrence[key];
      },
    );
    form.elements.date.value = toIsoDate(occurrence.date);
    form.elements.blocked.value = occurrence.blocked;
    form.elements.serialStart.value = occurrence.serialStart;
    form.elements.serialEnd.value = occurrence.serialEnd;
    form.elements.containerHourlyCost.value = occurrence.containerHourlyCost;
    form.elements.salesDelayHourlyCost.value = occurrence.salesDelayHourlyCost;
    const permissionNote = document.querySelector("#editPermissionNote");
    permissionNote.hidden = profile !== "Expedição";
    permissionNote.textContent =
      "A Expedição pode alterar somente os custos desta ocorrência.";
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = profile === "Expedição" && !field.closest(".cost-field");
    });
    dialog.showModal();
  };
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const filtered = data.filter((occurrence) => {
      const text = [
        occurrence.id,
        occurrence.model,
        occurrence.line,
        occurrence.defect,
        occurrence.description,
        occurrence.area,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || text.includes(query)) &&
        (!date.value || toIsoDate(occurrence.date) === date.value) &&
        (status.value === "Todos" || occurrence.status === status.value)
      );
    });
    body.innerHTML =
      occurrenceRows(filtered) ||
      `<tr><td colspan="9" class="empty">Nenhum bloqueio encontrado.</td></tr>`;
    result.textContent = `${filtered.length} de ${data.length} ocorrência(s) exibida(s)`;
    body
      .querySelectorAll("[data-edit]")
      .forEach(
        (button) => (button.onclick = () => openEditor(button.dataset.edit)),
      );
    body.querySelectorAll("[data-delete-occurrence]").forEach((button) => {
      button.onclick = () => {
        if (!deleteOccurrence(button.dataset.deleteOccurrence)) return;
        data = read();
        render();
      };
    });
    body
      .querySelectorAll("[data-select]")
      .forEach((link) => (link.onclick = () => choose(link.dataset.select)));
  };
  search.oninput = render;
  date.onchange = render;
  status.onchange = render;
  document.querySelector("#clearFilters").onclick = () => {
    search.value = "";
    date.value = "";
    status.value = "Todos";
    render();
  };
  document
    .querySelectorAll("[data-close-dialog]")
    .forEach((button) => (button.onclick = () => dialog.close()));
  form.onsubmit = (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const occurrence = data.find((item) => item.id === editingId);
    const values = new FormData(form);
    const serialStart = values.get("serialStart")?.trim();
    const serialEnd = values.get("serialEnd")?.trim();
    const editStatus = document.querySelector("#editFormStatus");
    if (
      profile === "Qualidade" &&
      serialStart.localeCompare(serialEnd, undefined, {
        numeric: true,
        sensitivity: "base",
      }) > 0
    ) {
      editStatus.textContent =
        "O serial final deve ser igual ou posterior ao serial inicial.";
      return;
    }
    editStatus.textContent = "";
    if (profile === "Qualidade") {
      const previousStatus = occurrence.status;
      ["model", "line", "defect", "description", "person", "status"].forEach(
        (key) => (occurrence[key] = values.get(key).trim()),
      );
      occurrence.date = fromIsoDate(values.get("date"));
      occurrence.createdAt = `${values.get("date")}T00:00:00`;
      occurrence.blocked = Number(values.get("blocked"));
      occurrence.serialStart = serialStart;
      occurrence.serialEnd = serialEnd;
      if (occurrence.status === "Finalizado" && previousStatus !== "Finalizado")
        occurrence.resolvedAt = new Date().toISOString();
      if (occurrence.status !== "Finalizado") occurrence.resolvedAt = null;
    }
    occurrence.containerHourlyCost = Number(
      values.get("containerHourlyCost") || 0,
    );
    occurrence.salesDelayHourlyCost = Number(
      values.get("salesDelayHourlyCost") || 0,
    );
    save(data);
    dialog.close();
    render();
  };
  render();
}

// Calcula indicadores e o progresso exibidos no Dashboard.
function initDashboard() {
  const metrics = document.querySelector("#dashboardMetrics");
  if (!metrics) return;
  const data = read();
  const open = data.filter((item) =>
    ["Iniciado", "Pendente"].includes(item.status),
  );
  const blocked = open.reduce((total, item) => total + item.blocked, 0);
  const checked = open.reduce((total, item) => total + inspected(item), 0);
  const ng = open.reduce((total, item) => total + defects(item), 0);
  const totalCost = open.reduce(
    (total, item) => total + accumulatedCost(item),
    0,
  );
  metrics.innerHTML = `
    <article class="metric-card"><span>Bloqueios abertos</span><strong>${open.length}</strong><small>ocorrências em acompanhamento</small></article>
    <article class="metric-card"><span>Unidades bloqueadas</span><strong>${num(blocked)}</strong><small>nos bloqueios abertos</small></article>
    <article class="metric-card"><span>Unidades inspecionadas</span><strong>${num(checked)}</strong><small>seriais classificados</small></article>
    <article class="metric-card"><span>Defeitos encontrados</span><strong>${num(ng)}</strong><small>resultado NG na inspeção</small></article>
    <article class="metric-card cost-metric"><span>Custo acumulado</span><strong>${money(totalCost)}</strong><small>containers e atraso de venda</small></article>`;
  document.querySelector("#dashboardRows").innerHTML =
    open
      .map((item) => {
        const percent = item.blocked
          ? Math.min(Math.round((inspected(item) / item.blocked) * 100), 100)
          : 0;
        return `<tr><td><strong>${esc(item.line)}</strong></td><td>${esc(item.model)}</td><td>${item.date}</td><td class="wrap">${esc(item.defect)}</td><td>${num(item.blocked)}</td><td>${num(pending(item))}</td><td>${num(defects(item))}</td><td>${statusBadge(item)}</td><td>${costPriorityCell(item)}</td><td><div class="progress-cell"><progress max="100" value="${percent}">${percent}%</progress><span>${percent}%</span></div></td></tr>`;
      })
      .join("") ||
    `<tr><td colspan="10" class="empty">Nenhuma ocorrência aberta ou pendente.</td></tr>`;
  document.querySelector("#dashboardUpdated").textContent =
    `Atualizado em ${new Date().toLocaleDateString("pt-BR")}`;
}

function getCurrent() {
  return read().find((item) => item.id === selected()) || read()[0];
}
function setLinks(occurrence) {
  document
    .querySelectorAll("[data-context-link]")
    .forEach(
      (link) => (link.href = link.dataset.contextLink + params(occurrence.id)),
    );
}

// Salva o método de retrabalho e seu arquivo anexo.
function initMethod() {
  const form = document.querySelector("#methodForm");
  if (!form) return;
  const occurrence = getCurrent();
  if (!occurrence) {
    location.replace("ocorrencias.html");
    return;
  }
  choose(occurrence.id);
  setLinks(occurrence);
  document.querySelector("#methodId").textContent = occurrence.id;
  document.querySelector("#methodSummary").innerHTML =
    `<strong>${esc(occurrence.defect)}</strong><br>${esc(occurrence.model)} · ${esc(occurrence.line)}<br>${num(occurrence.blocked)} unidades`;
  const fileInput = document.querySelector("#methodFile");
  const attachment = document.querySelector("#methodAttachment");
  const renderAttachment = () => {
    attachment.innerHTML = occurrence.methodFile
      ? `<div class="attachment-row"><div><strong>${esc(occurrence.methodFile.name)}</strong><small>${esc(occurrence.methodFile.type || "Arquivo do método")}</small></div><div class="table-actions"><a class="secondary" href="${occurrence.methodFile.data}" download="${esc(occurrence.methodFile.name)}">Baixar</a><button id="removeMethodFile" class="danger" type="button">Remover</button></div></div>`
      : `<p class="muted">Nenhum arquivo anexado a esta ocorrência.</p>`;
    document
      .querySelector("#removeMethodFile")
      ?.addEventListener("click", () => {
        occurrence.methodFile = null;
        const data = read();
        data[data.findIndex((item) => item.id === occurrence.id)] = occurrence;
        save(data);
        renderAttachment();
      });
  };
  renderAttachment();
  ["cause", "method", "classification", "department", "person"].forEach(
    (key) => (form.elements[key].value = occurrence[key] || ""),
  );
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = read();
    const target = data.find((item) => item.id === occurrence.id);
    const values = new FormData(form);
    ["cause", "method", "classification", "department", "person"].forEach(
      (key) => (target[key] = values.get(key).trim()),
    );
    const file = fileInput.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        document.querySelector("#methodFileStatus").textContent =
          "O arquivo deve ter no máximo 2 MB neste protótipo.";
        return;
      }
      target.methodFile = {
        name: file.name,
        type: file.type,
        data: await fileToDataUrl(file),
      };
    }
    if (target.status === "Pendente") target.status = "Iniciado";
    save(data);
    location.href = `seriais.html${params(target.id)}`;
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Registra os seriais inspecionados como OK ou NG.
function initScans() {
  const form = document.querySelector("#scanForm");
  if (!form) return;
  const occurrence = getCurrent();
  if (!occurrence) {
    location.replace("ocorrencias.html");
    return;
  }
  choose(occurrence.id);
  setLinks(occurrence);
  const input = document.querySelector("#serialScan");
  const status = document.querySelector("#scanStatus");
  const rows = document.querySelector("#scanRows");
  document.querySelector("#scanId").textContent = occurrence.id;
  document.querySelector("#scanRange").textContent =
    `Faixa aceita: ${occurrence.serialStart} a ${occurrence.serialEnd}`;
  const render = () => {
    rows.innerHTML =
      occurrence.scans
        .map(
          (scan) =>
            `<tr><td>${esc(scan.serial)}</td><td><span class="badge ${scan.result.toLowerCase()}">${scan.result}</span></td><td>${scan.at}</td><td>Qualidade</td><td><button class="danger compact-action" type="button" data-delete-scan="${esc(scan.serial)}">Excluir</button></td></tr>`,
        )
        .join("") ||
      `<tr><td colspan="5" class="empty">Nenhum serial bipado neste bloqueio.</td></tr>`;
    rows.querySelectorAll("[data-delete-scan]").forEach((button) => {
      button.onclick = () => {
        const index = occurrence.scans.findIndex(
          (scan) => scan.serial === button.dataset.deleteScan,
        );
        if (index < 0) return;
        occurrence.scans.splice(index, 1);
        const data = read();
        data[data.findIndex((item) => item.id === occurrence.id)] = occurrence;
        save(data);
        status.className = "status-message success";
        status.textContent = `Serial ${button.dataset.deleteScan} excluído.`;
        render();
      };
    });
    document.querySelector("#scanCount").textContent = inspected(occurrence);
    document.querySelector("#scanPending").textContent = num(
      pending(occurrence),
    );
  };
  const register = (result) => {
    const serial = input.value.trim();
    const inRange =
      serial.localeCompare(occurrence.serialStart, undefined, {
        numeric: true,
      }) >= 0 &&
      serial.localeCompare(occurrence.serialEnd, undefined, {
        numeric: true,
      }) <= 0;
    if (!serial || !inRange) {
      status.className = "status-message error";
      status.textContent = "Serial fora da faixa deste bloqueio.";
      return;
    }
    if (
      occurrence.scans.some(
        (scan) => scan.serial.toLowerCase() === serial.toLowerCase(),
      )
    ) {
      status.className = "status-message error";
      status.textContent = "Este serial já foi bipado.";
      return;
    }
    occurrence.scans.unshift({
      serial,
      result,
      at: new Date().toLocaleString("pt-BR"),
    });
    const data = read();
    data[data.findIndex((item) => item.id === occurrence.id)] = occurrence;
    save(data);
    status.className = "status-message success";
    status.textContent = `${serial} registrado como ${result}.`;
    input.value = "";
    render();
  };
  document.querySelector("#okScan").onclick = () => register("OK");
  document.querySelector("#ngScan").onclick = () => register("NG");
  form.onsubmit = (event) => {
    event.preventDefault();
    register("OK");
  };
  if (!occurrence.method) {
    document.querySelector("#scanGate").hidden = false;
    form
      .querySelectorAll("input, button")
      .forEach((element) => (element.disabled = true));
  }
  render();
}

// Exibe os containers vinculados ao bloqueio selecionado.
function initContainers() {
  const host = document.querySelector("#containerContent");
  if (!host) return;
  const occurrence = getCurrent();
  if (!occurrence) {
    location.replace("ocorrencias.html");
    return;
  }
  choose(occurrence.id);
  setLinks(occurrence);
  document.querySelector("#containerId").textContent = occurrence.id;
  host.innerHTML = `<article class="panel span-4"><h2>Resumo</h2><p>Bloqueado: <strong>${num(occurrence.blocked)}</strong><br>Em containers: <strong>${num(occurrence.containers.reduce((total, item) => total + item.qty, 0))}</strong></p></article><article class="panel span-8"><h2>Containers deste bloqueio</h2><div class="table-wrap"><table><thead><tr><th>Container</th><th>Quantidade</th><th>Ação</th></tr></thead><tbody>${occurrence.containers.map((container) => `<tr><td>${esc(container.id)}</td><td>${num(container.qty)}</td><td><a href="seriais.html${params(occurrence.id)}">Abrir bipagem</a></td></tr>`).join("")}</tbody></table></div></article>`;
}

// Exibe o resumo e a próxima ação da ocorrência.
function initDetail() {
  const host = document.querySelector("#detailContent");
  if (!host) return;
  const occurrence = getCurrent();
  if (!occurrence) {
    location.replace("ocorrencias.html");
    return;
  }
  choose(occurrence.id);
  setLinks(occurrence);
  document.querySelector("#pageId").textContent = occurrence.id;
  document.querySelector("#pageTitle").textContent = occurrence.defect;
  document.querySelector("#pageSubtitle").textContent =
    `${occurrence.line} · ${occurrence.model} · ${num(occurrence.blocked)} unidades bloqueadas`;
  host.innerHTML = `<article class="panel span-8"><h2>Dados do bloqueio</h2><div class="summary-list"><div><span>Parte / processo</span><strong>${esc(occurrence.part)}</strong></div><div><span>Área solicitante</span><strong>${esc(occurrence.area)}</strong></div><div><span>Faixa válida</span><strong>${esc(occurrence.serialStart)} — ${esc(occurrence.serialEnd)}</strong></div><div><span>Responsável</span><strong>${esc(occurrence.person)}</strong></div></div><p class="detail-description"><strong>Descrição</strong><br>${esc(occurrence.description)}</p></article><aside class="panel span-4"><h2>Próxima ação</h2><div class="notice">${occurrence.method ? "Método definido. A bipagem está liberada." : "Defina o método antes de iniciar a bipagem."}</div><a class="primary action-offset" href="${occurrence.method ? "seriais" : "metodo-retrabalho"}.html${params(occurrence.id)}">${occurrence.method ? "Bipar seriais" : "Definir método"}</a></aside>`;
}

// Cadastro visual de usuários e perfis.
function initUsers() {
  const dialog = document.querySelector("#userDialog");
  if (!dialog) return;
  const form = document.querySelector("#userForm");
  const rows = document.querySelector("#userRows");
  document.querySelector("#addUser").onclick = () => dialog.showModal();
  document
    .querySelectorAll("[data-close-user]")
    .forEach((button) => (button.onclick = () => dialog.close()));
  form.onsubmit = (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const row = document.createElement("tr");
    row.innerHTML = `<td>${esc(values.get("name"))}</td><td>${esc(values.get("area"))}</td><td>${esc(values.get("profile"))}</td><td><span class="badge defined">Ativo</span></td>`;
    rows.appendChild(row);
    form.reset();
    dialog.close();
  };
}

// Gera, imprime e exporta relatórios a partir das ocorrências salvas.
function initReports() {
  const output = document.querySelector("#reportOutput");
  if (!output) return;
  const data = read();
  const start = document.querySelector("#reportStart");
  const end = document.querySelector("#reportEnd");
  const status = document.querySelector("#reportStatus");
  const line = document.querySelector("#reportLine");
  let reportData = [];

  [...new Set(data.map((item) => item.line))]
    .sort()
    .forEach((itemLine) => line.add(new Option(itemLine, itemLine)));

  const render = () => {
    reportData = data.filter((item) => {
      const itemDate = toIsoDate(item.date);
      return (
        (!start.value || itemDate >= start.value) &&
        (!end.value || itemDate <= end.value) &&
        (status.value === "Todos" || item.status === status.value) &&
        (!line.value || item.line === line.value)
      );
    });
    const totalBlocked = reportData.reduce(
      (total, item) => total + item.blocked,
      0,
    );
    const totalPending = reportData.reduce(
      (total, item) => total + pending(item),
      0,
    );
    const totalCost = reportData.reduce(
      (total, item) => total + accumulatedCost(item),
      0,
    );
    const highPriorities = reportData.filter(
      (item) => priority(item).level === "high",
    ).length;
    document.querySelector("#reportMetrics").innerHTML = `
      <article class="metric-card"><span>Ocorrências</span><strong>${reportData.length}</strong><small>registros selecionados</small></article>
      <article class="metric-card"><span>Quantidade bloqueada</span><strong>${num(totalBlocked)}</strong><small>unidades no período</small></article>
      <article class="metric-card"><span>Quantidade pendente</span><strong>${num(totalPending)}</strong><small>unidades ainda bloqueadas</small></article>
      <article class="metric-card"><span>Custo acumulado</span><strong>${money(totalCost)}</strong><small>impacto financeiro estimado</small></article>
      <article class="metric-card"><span>Prioridade alta</span><strong>${highPriorities}</strong><small>ocorrências que exigem atenção</small></article>`;
    document.querySelector("#reportRows").innerHTML =
      reportData
        .map((item) => {
          const itemPriority = priority(item);
          return `<tr><td>${esc(item.id)}</td><td>${item.date}</td><td>${esc(item.line)}</td><td>${esc(item.model)}</td><td>${esc(item.defect)}</td><td>${num(item.blocked)}</td><td>${num(pending(item))}</td><td>${statusBadge(item)}</td><td>${money(accumulatedCost(item))}</td><td><span class="priority ${itemPriority.level}">${itemPriority.icon} ${itemPriority.label}</span></td></tr>`;
        })
        .join("") ||
      `<tr><td colspan="10" class="empty">Nenhuma ocorrência encontrada para os filtros selecionados.</td></tr>`;
    const periodStart = start.value
      ? fromIsoDate(start.value)
      : "início dos registros";
    const periodEnd = end.value ? fromIsoDate(end.value) : "hoje";
    document.querySelector("#reportPeriod").textContent =
      `Período: ${periodStart} até ${periodEnd}`;
    document.querySelector("#reportGeneratedAt").textContent =
      `Gerado em ${new Date().toLocaleString("pt-BR")}`;
    document.querySelector("#reportCount").textContent =
      `${reportData.length} registro(s)`;
    translatePage();
  };

  document.querySelector("#generateReport").onclick = render;
  document.querySelector("#clearReport").onclick = () => {
    start.value = "";
    end.value = "";
    status.value = "Todos";
    line.value = "";
    render();
  };
  document.querySelector("#printReport").onclick = () => window.print();
  document.querySelector("#exportReport").onclick = () => {
    const csvCell = (value) => {
      let safeValue = String(value ?? "");
      if (/^[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
      return `"${safeValue.replaceAll('"', '""')}"`;
    };
    const headers = [
      "ID",
      "Data",
      "Linha",
      "Modelo",
      "Problema",
      "Bloqueada",
      "Pendente",
      "Status",
      "Custo",
      "Prioridade",
    ];
    const rows = reportData.map((item) => [
      item.id,
      item.date,
      item.line,
      item.model,
      item.defect,
      item.blocked,
      pending(item),
      item.status,
      accumulatedCost(item).toFixed(2),
      priority(item).label,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-ocorrencias-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  render();
}

// Formulário em etapas para criar uma nova ocorrência.
function initNew() {
  const form = document.querySelector("#newOccurrence");
  if (!form) return;
  const step1 = document.querySelector("#step1");
  const step2 = document.querySelector("#step2");
  const stepMark1 = document.querySelector("#stepMark1");
  const stepMark2 = document.querySelector("#stepMark2");
  const rows = document.querySelector("#containerRows");
  const addRow = () => {
    const row = document.createElement("div");
    row.className = "container-row";
    row.innerHTML = `<div class="field"><label>Container *</label><input name="containerId" required></div><div class="field"><label>Quantidade *</label><input name="containerQty" type="number" min="1" required></div><button type="button" class="danger">Remover</button>`;
    row.querySelector("button").onclick = () => row.remove();
    rows.appendChild(row);
  };
  addRow();
  document.querySelector("#addContainer").onclick = addRow;
  document.querySelector("#nextStep").onclick = () => {
    if (
      [...step1.querySelectorAll("[required]")].some(
        (input) => !input.reportValidity(),
      )
    )
      return;
    step1.hidden = true;
    step2.hidden = false;
    stepMark1.classList.remove("active");
    stepMark2.classList.add("active");
    document.querySelector("#step2Title").focus();
  };
  document.querySelector("#backStep").onclick = () => {
    step2.hidden = true;
    step1.hidden = false;
    stepMark2.classList.remove("active");
    stepMark1.classList.add("active");
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const data = read();
    const serialStart = values.get("serialStart").trim();
    const serialEnd = values.get("serialEnd").trim();
    const blocked = Number(values.get("blocked"));
    const detected = Number(values.get("detected"));
    const currentIds = data
      .map((item) => Number(item.id.split("-")[1]))
      .filter(Number.isFinite);
    const id = `RW-${String(Math.max(0, ...currentIds) + 1).padStart(3, "0")}`;
    const containers = values.getAll("containerId").map((value, index) => ({
      id: value,
      qty: Number(values.getAll("containerQty")[index]),
    }));
    const occurrence = {
      id,
      date: new Date().toLocaleDateString("pt-BR"),
      line: values.get("line"),
      part: values.get("part"),
      defect: values.get("defect"),
      description: values.get("description"),
      serialStart,
      serialEnd,
      blocked,
      model: values.get("model"),
      area: values.get("area"),
      detected,
      classification: values.get("classification"),
      department: values.get("department"),
      person: values.get("person"),
      cause: values.get("cause"),
      method: values.get("method"),
      containerHourlyCost: Number(values.get("containerHourlyCost") || 0),
      salesDelayHourlyCost: Number(values.get("salesDelayHourlyCost") || 0),
      createdAt: new Date().toISOString(),
      status: "Pendente",
      containers,
      scans: [],
    };
    const newStatus = document.querySelector("#newStatus");
    if (
      serialStart.localeCompare(serialEnd, undefined, {
        numeric: true,
        sensitivity: "base",
      }) > 0
    ) {
      newStatus.textContent =
        "O serial final deve ser igual ou posterior ao serial inicial.";
      return;
    }
    if (detected > blocked) {
      newStatus.textContent =
        "A quantidade detectada não pode superar a quantidade bloqueada.";
      return;
    }
    if (
      containers.reduce((total, item) => total + item.qty, 0) !==
      occurrence.blocked
    ) {
      newStatus.textContent =
        "A soma dos containers deve ser igual à quantidade bloqueada.";
      return;
    }
    data.unshift(occurrence);
    save(data);
    choose(id);
    location.href = `detalhes-ocorrencia.html${params(id)}`;
  };
}

// Inicializa somente os recursos existentes na página aberta.
document.addEventListener("DOMContentLoaded", () => {
  initPreferences();
  if (initLogin()) {
    translatePage();
    return;
  }
  const activeProfile = sessionStorage.getItem("rework-profile");
  const page = location.pathname.split("/").pop();
  if (!activeProfile && page !== "dashboard.html") {
    location.replace("index.html");
    return;
  }
  if (activeProfile === "Produção" && page !== "dashboard.html") {
    location.replace("dashboard.html");
    return;
  }
  const allowedPages = {
    Engenharia: [
      "dashboard.html",
      "ocorrencias.html",
      "metodo-retrabalho.html",
    ],
    Expedição: ["dashboard.html", "ocorrencias.html"],
  };
  if (
    allowedPages[activeProfile] &&
    !allowedPages[activeProfile].includes(page)
  ) {
    location.replace("dashboard.html");
    return;
  }
  renderShell();
  bindGlobal();
  initDashboard();
  initOccurrences();
  initNew();
  initDetail();
  initMethod();
  initScans();
  initContainers();
  initUsers();
  initReports();
  translatePage();
});
