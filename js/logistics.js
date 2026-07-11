(() => {
  "use strict";

  const api = window.CC_ATLAS_API;
  if (!api) return;

  const LOCAL_KEY = "cc_logistics_state_v040";
  const CATEGORIES = [
    { id: "ground", label: "Ground Assets" },
    { id: "air", label: "Air Assets" },
    { id: "base", label: "Base Supplies" },
    { id: "general", label: "General Supplies" }
  ];
  const STATUSES = [
    { id: "operational", label: "Operational" },
    { id: "maintenance", label: "Requires Maintenance" },
    { id: "salvageable", label: "Salvageable" }
  ];
  const SEED_COMPANIES = [
    { id: "dorn", name: "Dorn Company", capOverride: null, points: 100 },
    { id: "makeshift", name: "Makeshift Company", capOverride: null, points: 100 },
    { id: "vixus", name: "Vixus Company", capOverride: null, points: 100 },
    { id: "fourth", name: "4th Company", capOverride: null, points: 100 }
  ];
  const SEED_CATALOG = [
    ["ground","at-te","AT-TE",24],["ground","at-ap","AT-AP",27],["ground","at-ot","AT-OT",10],
    ["ground","at-pt","AT-PT",12],["ground","barc-speeder","BARC Speeder",6],["ground","rho-cargo-pod","Rho-class Cargo Pod",3],
    ["ground","at-rt","AT-RT",9],["ground","tx-427","TX-427",18],["ground","tx-130","TX-130",15],
    ["ground","isp","ISP",12],["ground","av-7","AV-7",12],
    ["air","laat-i","LAAT/i",30],["air","laat-c","LAAT/c",15],["air","rho-transport-shuttle","Rho-class Transport Shuttle",9],
    ["air","v-wing","V-Wing",6],["air","y-wing","Y-Wing",15],["air","arc-170","ARC-170",12],
    ["base","fob-supplies","FOB Supplies",21],["base","outpost-supplies","Outpost Supplies",9],["base","signal-equipment","Signal Equipment",6],
    ["base","building","Building",6],["base","shield-generator","Shield Generator",9],["base","medical-tent","Medical Tent",6],
    ["base","medical-droid","Medical Droid",15],["base","bacta-tank","Bacta Tank",9],["base","e-web","E-WEB",3],
    ["base","at-turret","AT Turret",6],["base","aa-turret","AA Turret",6],["base","ap-turret","AP Turret",6],
    ["general","food","Food",3],["general","medical","Medical",6],["general","blaster-rifles","Blaster Rifles",9],["general","explosives","Explosives",9]
  ].map(([category,id,name,cost]) => ({ category,id,name,cost,active:true }));

  const els = Object.fromEntries([
    "logisticsBackendPill","logisticsAdminBackendPill","logisticsCategorySelect","logisticsCatalogList","logisticsCompanySelect",
    "logisticsCompanyTitle","logisticsPointReadout","logisticsTrackerList","logisticsSummary","accountStatus","discordLoginBtn","accountLogoutBtn",
    "logisticsAdminCard","setCompanyPointsForm",
    "setPointsCompanySelect","setCompanyPointsInput","requisitionSiteBreakdown","syncRequisitionSitesBtn","runWeeklyGrantBtn",
    "logisticsRootSettings","logisticsSettingsForm","defaultCompanyCapInput","salvagePercentInput","weeklyBaseInput",
    "resourceMinorInput","resourceStandardInput","resourceMajorInput","productionMinorInput","productionStandardInput","productionMajorInput",
    "companyConfigList","catalogItemForm","catalogItemId","catalogItemCategory","catalogItemName","catalogItemCost",
    "catalogItemNewBtn","catalogItemDeleteBtn","catalogConfigList","accountAssignmentList"
  ].map(id => [id, document.getElementById(id)]));

  const state = {
    data: loadLocal(),
    selectedCategory: "ground",
    selectedCompanyId: "dorn",
    client: null,
    backendEnabled: false,
    session: null,
    profile: null,
    profiles: [],
    channel: null,
    syncTimer: null,
    atlasSaveTimer: null,
    atlasApplyingRemote: false,
    loading: false
  };

  function baseState() {
    return {
      settings: {
        defaultCompanyCap: 100,
        salvagePercent: 33,
        weeklyBase: 15,
        resourceMinor: 1,
        resourceStandard: 2,
        resourceMajor: 3,
        productionMinor: 2,
        productionStandard: 4,
        productionMajor: 6,
        lastWeeklyGrantAt: null
      },
      companies: structuredClone(SEED_COMPANIES),
      catalog: structuredClone(SEED_CATALOG),
      assets: [],
      ledger: []
    };
  }

  function loadLocal() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
      if (!parsed) return baseState();
      const defaults = baseState();
      return {
        settings: { ...defaults.settings, ...(parsed.settings || {}) },
        companies: Array.isArray(parsed.companies) && parsed.companies.length ? parsed.companies : defaults.companies,
        catalog: Array.isArray(parsed.catalog) && parsed.catalog.length ? parsed.catalog : defaults.catalog,
        assets: Array.isArray(parsed.assets) ? parsed.assets : [],
        ledger: Array.isArray(parsed.ledger) ? parsed.ledger : []
      };
    } catch {
      return baseState();
    }
  }

  function saveLocal() {
    if (!state.backendEnabled) localStorage.setItem(LOCAL_KEY, JSON.stringify(state.data));
  }

  const esc = value => api.escapeHtml(String(value ?? ""));
  const categoryLabel = id => CATEGORIES.find(item => item.id === id)?.label || id;
  const statusLabel = id => STATUSES.find(item => item.id === id)?.label || id;
  const companyById = id => state.data.companies.find(company => company.id === id);
  const itemById = id => state.data.catalog.find(item => item.id === id);
  const capForCompany = company => Math.max(0, Number(company?.capOverride ?? state.data.settings.defaultCompanyCap ?? 0));
  const effectiveRole = () => state.profile?.app_role || api.getRole();
  const isAdmin = () => ["admin","root"].includes(effectiveRole());
  const isRoot = () => effectiveRole() === "root";
  const isCommand = () => effectiveRole() === "command";
  const assignedCompanyId = () => state.profile?.company_id || null;

  function canRequisition(companyId) {
    if (isAdmin()) return true;
    if (!isCommand()) return false;
    if (!state.backendEnabled) return true;
    return Boolean(assignedCompanyId() && assignedCompanyId() === companyId);
  }

  function statusClass(status) {
    return status === "maintenance" ? "maintenance" : status === "salvageable" ? "salvageable" : "operational";
  }

  function fillStaticSelects() {
    const categoryOptions = CATEGORIES.map(item => `<option value="${item.id}">${item.label}</option>`).join("");
    if (els.logisticsCategorySelect && !els.logisticsCategorySelect.options.length) els.logisticsCategorySelect.innerHTML = categoryOptions;
    if (els.catalogItemCategory && !els.catalogItemCategory.options.length) els.catalogItemCategory.innerHTML = categoryOptions;
  }

  function companyOptions(selectedId = "") {
    return state.data.companies.map(company => `<option value="${esc(company.id)}" ${company.id === selectedId ? "selected" : ""}>${esc(company.name)}</option>`).join("");
  }

  function render() {
    fillStaticSelects();
    if (!state.data.companies.some(company => company.id === state.selectedCompanyId)) state.selectedCompanyId = state.data.companies[0]?.id || "";
    if (els.logisticsCategorySelect) els.logisticsCategorySelect.value = state.selectedCategory;
    if (els.logisticsCompanySelect) els.logisticsCompanySelect.innerHTML = companyOptions(state.selectedCompanyId);
    renderCatalog();
    renderTracker();
    renderSummary();
    renderBackendStatus();
    renderAdmin();
  }

  function renderBackendStatus() {
    const text = state.backendEnabled ? (state.session ? "Shared Database Online" : "Shared Viewer Online") : "Local Test Data";
    [els.logisticsBackendPill, els.logisticsAdminBackendPill].forEach(node => { if (node) node.textContent = text; });
    if (!els.accountStatus) return;
    if (!state.backendEnabled) {
      els.accountStatus.textContent = "Local testing mode. Configure Supabase to enable Discord login, shared logistics, and the shared galaxy map.";
      els.discordLoginBtn?.classList.remove("hidden");
      els.discordLoginBtn.disabled = true;
      els.accountLogoutBtn?.classList.add("hidden");
      return;
    }
    els.discordLoginBtn.disabled = false;
    if (state.session && state.profile) {
      els.accountStatus.textContent = `${state.profile.display_name || "Discord User"} · ${statusLabelRole(state.profile.app_role)}${state.profile.company_id ? ` · ${companyById(state.profile.company_id)?.name || "Assigned Company"}` : ""}`;
      els.discordLoginBtn.classList.add("hidden");
      els.accountLogoutBtn.classList.remove("hidden");
    } else {
      els.accountStatus.textContent = "Sign in with Discord to use your assigned company and publish authorized galaxy-map changes.";
      els.discordLoginBtn.classList.remove("hidden");
      els.accountLogoutBtn.classList.add("hidden");
    }
  }

  const statusLabelRole = role => ({viewer:"Viewer",command:"Command",admin:"Admin",root:"Root"}[role] || "Viewer");

  function renderCatalog() {
    if (!els.logisticsCatalogList) return;
    const company = companyById(state.selectedCompanyId);
    const points = Number(company?.points || 0);
    const allowed = canRequisition(state.selectedCompanyId);
    const items = state.data.catalog
      .filter(item => item.active !== false && item.category === state.selectedCategory)
      .sort((a,b) => a.name.localeCompare(b.name));
    els.logisticsCatalogList.innerHTML = items.length ? items.map(item => {
      const disabled = !allowed || !company || points < Number(item.cost || 0);
      const reason = !allowed ? "You are not assigned to requisition for this company." : points < item.cost ? "Insufficient requisition points." : "";
      return `<div class="catalog-row">
        <div><strong>${esc(item.name)}</strong><span>${Number(item.cost || 0)} RP</span></div>
        <button class="primary-button" data-requisition-item="${esc(item.id)}" ${disabled ? "disabled" : ""} title="${esc(reason)}">Requisition</button>
      </div>`;
    }).join("") : '<p class="empty-state">No catalog items in this category.</p>';
  }

  function renderTracker() {
    if (!els.logisticsTrackerList) return;
    const company = companyById(state.selectedCompanyId);
    if (!company) {
      els.logisticsTrackerList.innerHTML = '<p class="empty-state">No company selected.</p>';
      return;
    }
    const cap = capForCompany(company);
    els.logisticsCompanyTitle.textContent = company.name;
    els.logisticsPointReadout.textContent = `${Number(company.points || 0)} / ${cap} RP`;
    const assets = state.data.assets.filter(asset => asset.companyId === company.id);
    els.logisticsTrackerList.innerHTML = CATEGORIES.map(category => {
      const categoryAssets = assets.filter(asset => asset.category === category.id);
      const groups = new Map();
      for (const asset of categoryAssets) {
        const key = asset.catalogItemId || `${asset.category}:${asset.name}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(asset);
      }
      const sorted = [...groups.entries()].sort((a,b) => (itemById(a[0])?.name || a[1][0]?.name || "").localeCompare(itemById(b[0])?.name || b[1][0]?.name || ""));
      return `<section class="tracker-category">
        <h4>${category.label}<span>${categoryAssets.length}</span></h4>
        ${sorted.length ? sorted.map(([key, units]) => renderAssetGroup(key, units)).join("") : '<p class="empty-state">Nothing stocked.</p>'}
      </section>`;
    }).join("");
  }

  function renderAssetGroup(key, units) {
    const item = itemById(key);
    const name = item?.name || units[0]?.name || "Asset";
    const sortedUnits = [...units].sort((a,b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    return `<div class="asset-group">
      <div class="asset-group-title"><strong>${esc(name)}</strong><span>×${sortedUnits.length}</span></div>
      <div class="asset-unit-list">${sortedUnits.map((unit,index) => renderAssetUnit(unit,index+1)).join("")}</div>
    </div>`;
  }

  function renderAssetUnit(asset, index) {
    const admin = isAdmin();
    const status = asset.status || "operational";
    const controls = admin ? `<select class="asset-status-select" data-asset-status="${esc(asset.id)}">
      ${STATUSES.map(option => `<option value="${option.id}" ${option.id === status ? "selected" : ""}>${option.label}</option>`).join("")}
    </select>` : `<span class="condition-chip ${statusClass(status)}">${statusLabel(status)}</span>`;
    const action = admin && status === "maintenance" ? `<button class="ghost-button" data-repair-asset="${esc(asset.id)}">Repair</button>`
      : admin && status === "salvageable" ? `<button class="danger-button" data-salvage-asset="${esc(asset.id)}">Salvage</button>` : "";
    return `<div class="asset-unit">
      <span class="unit-number">#${index}</span>
      <span class="condition-dot ${statusClass(status)}"></span>
      <div class="unit-controls">${controls}${action}</div>
    </div>`;
  }

  function renderSummary() {
    if (!els.logisticsSummary) return;
    const company = companyById(state.selectedCompanyId);
    if (!company) return;
    const assets = state.data.assets.filter(asset => asset.companyId === company.id);
    const counts = Object.fromEntries(CATEGORIES.map(category => [category.id, assets.filter(asset => asset.category === category.id).length]));
    const cap = capForCompany(company);
    els.logisticsSummary.innerHTML = `<div class="summary-grid">
      ${CATEGORIES.map(category => `<div><strong>${counts[category.id]}</strong><span>${category.label}</span></div>`).join("")}
    </div>
    <div class="requisition-summary"><span>Company Requisition</span><strong>${Number(company.points || 0)} / ${cap} RP</strong></div>`;
  }

  function calculateSiteIncome() {
    const atlas = api.getData();
    const republicIds = new Set((atlas.factions || []).filter(faction => {
      const haystack = `${faction.id} ${faction.code} ${faction.name}`.toLowerCase();
      return faction.id === "gar" || haystack.includes("republic") || haystack.includes("grand army") || faction.code?.toLowerCase() === "gar";
    }).map(faction => faction.id));
    if (!republicIds.size) republicIds.add("gar");
    const bodies = new Map((atlas.bodies || []).map(body => [body.id, body.name]));
    const siteValues = state.data.settings;
    const rows = [];
    const byBody = new Map();
    let sitePoints = 0;
    for (const poi of atlas.pois || []) {
      if (!republicIds.has(poi.factionId)) continue;
      if (!["resource","production"].includes(poi.type)) continue;
      const tier = ["critical","decisive"].includes(poi.strategicTier) ? "major" : (poi.strategicTier || "minor");
      if (!["minor","standard","major"].includes(tier)) continue;
      const key = `${poi.type}${tier[0].toUpperCase()}${tier.slice(1)}`;
      const value = Number(siteValues[key] || 0);
      sitePoints += value;
      const bodyId = poi.bodyId || "unknown";
      if (!byBody.has(bodyId)) byBody.set(bodyId, { bodyId, bodyName: bodies.get(bodyId) || bodyId, total:0, points:0, resource:{minor:0,standard:0,major:0}, production:{minor:0,standard:0,major:0} });
      const body = byBody.get(bodyId);
      body.total += 1;
      body.points += value;
      body[poi.type][tier] += 1;
      rows.push({ id:poi.id, bodyId, bodyName:body.bodyName, siteType:poi.type, tier, factionId:poi.factionId });
    }
    return {
      rows,
      byBody:[...byBody.values()].sort((a,b) => a.bodyName.localeCompare(b.bodyName)),
      siteCount:rows.length,
      sitePoints,
      base:Number(siteValues.weeklyBase || 0),
      total:Number(siteValues.weeklyBase || 0) + sitePoints
    };
  }

  function renderAdmin() {
    if (!els.logisticsAdminCard) return;
    const admin = isAdmin();
    const root = isRoot();
    els.logisticsAdminCard.classList.toggle("hidden", !admin);
    if (!admin) return;
    const companyOpts = companyOptions();
    els.setPointsCompanySelect.innerHTML = companyOpts;
    document.querySelectorAll(".root-only-section").forEach(node => node.classList.toggle("hidden", !root));
    renderSiteBreakdown();
    renderSettingsForm();
    renderCompanyConfig();
    renderCatalogConfig();
    renderAccountAssignments();
  }

  function renderSiteBreakdown() {
    if (!els.requisitionSiteBreakdown) return;
    const calc = calculateSiteIncome();
    const bodyRows = calc.byBody.map(body => `<div class="site-body-row">
      <strong>${esc(body.bodyName)}</strong><span>${body.total} sites · ${body.points} RP</span>
      <small>Resource M/S/M+: ${body.resource.minor}/${body.resource.standard}/${body.resource.major} · Production M/S/M+: ${body.production.minor}/${body.production.standard}/${body.production.major}</small>
    </div>`).join("");
    els.requisitionSiteBreakdown.innerHTML = `<div class="site-total"><strong>${calc.siteCount} Republic requisition sites</strong><span>Base ${calc.base} + Sites ${calc.sitePoints} = <b>${calc.total} RP/week per company</b></span></div>${bodyRows || '<p class="empty-state">No Republic Resource or Production Sites are currently held.</p>'}`;
  }

  function renderSettingsForm() {
    const s = state.data.settings;
    const pairs = [
      [els.defaultCompanyCapInput,s.defaultCompanyCap],[els.salvagePercentInput,s.salvagePercent],[els.weeklyBaseInput,s.weeklyBase],
      [els.resourceMinorInput,s.resourceMinor],[els.resourceStandardInput,s.resourceStandard],[els.resourceMajorInput,s.resourceMajor],
      [els.productionMinorInput,s.productionMinor],[els.productionStandardInput,s.productionStandard],[els.productionMajorInput,s.productionMajor]
    ];
    pairs.forEach(([input,value]) => { if (input && document.activeElement !== input) input.value = Number(value ?? 0); });
  }

  function renderCompanyConfig() {
    if (!els.companyConfigList) return;
    els.companyConfigList.innerHTML = state.data.companies.map(company => `<div class="configuration-row company-configuration-row" data-company-config="${esc(company.id)}">
      <input data-company-name value="${esc(company.name)}" aria-label="Company name" />
      <input data-company-cap type="number" min="0" placeholder="Default cap" value="${company.capOverride ?? ""}" aria-label="Cap override" />
      <button class="ghost-button" data-save-company-config="${esc(company.id)}">Save</button>
    </div>`).join("");
  }

  function renderCatalogConfig() {
    if (!els.catalogConfigList) return;
    els.catalogConfigList.innerHTML = state.data.catalog.slice().sort((a,b) => categoryLabel(a.category).localeCompare(categoryLabel(b.category)) || a.name.localeCompare(b.name)).map(item => `<button class="configuration-row catalog-config-button" data-edit-catalog="${esc(item.id)}">
      <span>${esc(categoryLabel(item.category))}</span><strong>${esc(item.name)}</strong><em>${Number(item.cost || 0)} RP</em>
    </button>`).join("");
  }

  function renderAccountAssignments() {
    if (!els.accountAssignmentList) return;
    if (!state.backendEnabled) {
      els.accountAssignmentList.innerHTML = '<p class="empty-state">Enable Supabase and Discord OAuth to manage account assignments.</p>';
      return;
    }
    if (!state.profiles.length) {
      els.accountAssignmentList.innerHTML = '<p class="empty-state">No Discord users have signed in yet.</p>';
      return;
    }
    els.accountAssignmentList.innerHTML = state.profiles.map(profile => `<div class="configuration-row account-assignment-row" data-profile-row="${esc(profile.id)}">
      <div><strong>${esc(profile.display_name || "Discord User")}</strong><small>${esc(profile.discord_user_id || profile.id)}</small></div>
      <select data-profile-role>${["viewer","command","admin","root"].map(role => `<option value="${role}" ${profile.app_role === role ? "selected" : ""}>${statusLabelRole(role)}</option>`).join("")}</select>
      <select data-profile-company><option value="">No Company</option>${state.data.companies.map(company => `<option value="${esc(company.id)}" ${profile.company_id === company.id ? "selected" : ""}>${esc(company.name)}</option>`).join("")}</select>
      <button class="ghost-button" data-save-profile="${esc(profile.id)}">Save</button>
    </div>`).join("");
  }

  async function requisition(itemId) {
    const company = companyById(state.selectedCompanyId);
    const item = itemById(itemId);
    if (!company || !item || !canRequisition(company.id)) return api.flashMessage("You cannot requisition for this company.");
    if (state.backendEnabled) {
      const { error } = await state.client.rpc("requisition_logistics_asset", { p_company_id: company.id, p_catalog_item_id: item.id });
      if (error) return api.flashMessage(error.message);
      await loadSharedData();
      api.flashMessage(`${item.name} requisitioned for ${company.name}.`);
      return;
    }
    if (company.points < item.cost) return api.flashMessage("Insufficient requisition points.");
    company.points -= item.cost;
    state.data.assets.push({ id:api.uuid("asset"), companyId:company.id, catalogItemId:item.id, category:item.category, name:item.name, status:"operational", createdAt:new Date().toISOString() });
    addLedger(company.id, -item.cost, "requisition", item.name);
    saveLocal(); render();
  }

  async function changeStatus(assetId, status) {
    if (!isAdmin()) return;
    if (state.backendEnabled) {
      const { error } = await state.client.rpc("set_logistics_asset_status", { p_asset_id:assetId, p_status:status });
      if (error) return api.flashMessage(error.message);
      await loadSharedData(); return;
    }
    const asset = state.data.assets.find(item => item.id === assetId);
    if (asset) asset.status = status;
    saveLocal(); render();
  }

  async function repair(assetId) {
    if (!isAdmin()) return;
    const raw = prompt("Requisition Points used for repair?", "0");
    if (raw === null) return;
    const cost = Math.max(0, Math.floor(Number(raw)));
    if (!Number.isFinite(cost)) return api.flashMessage("Enter a valid repair cost.");
    if (state.backendEnabled) {
      const { error } = await state.client.rpc("repair_logistics_asset", { p_asset_id:assetId, p_cost:cost });
      if (error) return api.flashMessage(error.message);
      await loadSharedData(); return;
    }
    const asset = state.data.assets.find(item => item.id === assetId);
    const company = companyById(asset?.companyId);
    if (!asset || !company) return;
    if (company.points < cost) return api.flashMessage("The company does not have enough requisition points for that repair.");
    company.points -= cost;
    asset.status = "operational";
    addLedger(company.id, -cost, "repair", asset.name);
    saveLocal(); render();
  }

  async function salvage(assetId) {
    if (!isAdmin()) return;
    const asset = state.data.assets.find(item => item.id === assetId);
    const item = itemById(asset?.catalogItemId);
    const company = companyById(asset?.companyId);
    if (!asset || !company) return;

    const defaultPercent = Math.max(10, Math.min(50, Math.round(Number(state.data.settings.salvagePercent || 33))));
    const rawPercent = prompt("Salvage return percentage? Enter a value from 10% to 50%.", String(defaultPercent));
    if (rawPercent === null) return;
    const salvagePercent = Math.round(Number(rawPercent));
    if (!Number.isFinite(salvagePercent) || salvagePercent < 10 || salvagePercent > 50) {
      return api.flashMessage("Salvage percentage must be a whole number from 10 to 50.");
    }

    const currentCost = Number(item?.cost || 0);
    const refund = Math.ceil(currentCost * salvagePercent / 100);
    if (!confirm(`Salvage ${item?.name || asset.name} at ${salvagePercent}%? Current catalog value ${currentCost} RP; expected return ${refund} RP before the company cap.`)) return;

    if (state.backendEnabled) {
      const { data, error } = await state.client.rpc("salvage_logistics_asset", {
        p_asset_id: assetId,
        p_salvage_percent: salvagePercent
      });
      if (error) return api.flashMessage(error.message);
      await loadSharedData();
      api.flashMessage(`Asset salvaged. ${data ?? refund} RP restored within the company cap.`);
      return;
    }

    const cap = capForCompany(company);
    const credited = Math.max(0, Math.min(refund, cap - company.points));
    company.points += credited;
    state.data.assets = state.data.assets.filter(item => item.id !== assetId);
    addLedger(company.id, credited, "salvage", `${item?.name || asset.name} at ${salvagePercent}%`);
    saveLocal();
    render();
  }

  async function setCompanyPoints(companyId, points) {
    points = Math.max(0, Math.floor(Number(points)));
    if (!isAdmin()) return;
    if (state.backendEnabled) {
      const { error } = await state.client.rpc("set_logistics_company_points", { p_company_id:companyId, p_points:points });
      if (error) return api.flashMessage(error.message);
      await loadSharedData(); return;
    }
    const company = companyById(companyId); if (!company) return;
    company.points = Math.min(points, capForCompany(company));
    saveLocal(); render();
  }

  async function saveSettings(event) {
    event.preventDefault(); if (!isRoot()) return;
    const payload = {
      defaultCompanyCap:Math.max(0,Number(els.defaultCompanyCapInput.value || 0)),
      salvagePercent:Math.max(10,Math.min(50,Number(els.salvagePercentInput.value || 33))),
      weeklyBase:Math.max(0,Number(els.weeklyBaseInput.value || 0)),
      resourceMinor:Math.max(0,Number(els.resourceMinorInput.value || 0)), resourceStandard:Math.max(0,Number(els.resourceStandardInput.value || 0)), resourceMajor:Math.max(0,Number(els.resourceMajorInput.value || 0)),
      productionMinor:Math.max(0,Number(els.productionMinorInput.value || 0)), productionStandard:Math.max(0,Number(els.productionStandardInput.value || 0)), productionMajor:Math.max(0,Number(els.productionMajorInput.value || 0))
    };
    if (state.backendEnabled) {
      const dbPayload = Object.fromEntries(Object.entries(payload).map(([key,value]) => [camelToSnake(key),value]));
      const { error } = await state.client.from("logistics_settings").update(dbPayload).eq("id",1);
      if (error) return api.flashMessage(error.message);
      await loadSharedData(); return;
    }
    Object.assign(state.data.settings,payload); saveLocal(); render();
  }

  async function saveCompanyConfig(companyId, row) {
    if (!isRoot()) return;
    const company = companyById(companyId); if (!company) return;
    const name = row.querySelector("[data-company-name]").value.trim() || company.name;
    const capRaw = row.querySelector("[data-company-cap]").value.trim();
    const capOverride = capRaw === "" ? null : Math.max(0,Number(capRaw));
    if (state.backendEnabled) {
      const { error } = await state.client.from("logistics_companies").update({name,cap_override:capOverride}).eq("id",companyId);
      if (error) return api.flashMessage(error.message);
      await loadSharedData(); return;
    }
    company.name=name; company.capOverride=capOverride; company.points=Math.min(company.points,capForCompany(company)); saveLocal(); render();
  }

  async function saveCatalogItem(event) {
    event.preventDefault(); if (!isRoot()) return;
    const id = els.catalogItemId.value || slugify(els.catalogItemName.value) || api.uuid("catalog");
    const payload = { id, category:els.catalogItemCategory.value, name:els.catalogItemName.value.trim(), cost:Math.max(0,Number(els.catalogItemCost.value || 0)), active:true };
    if (!payload.name) return;
    if (state.backendEnabled) {
      const { error } = await state.client.from("logistics_catalog").upsert({id:payload.id,category:payload.category,name:payload.name,cost:payload.cost,active:true});
      if (error) return api.flashMessage(error.message);
      clearCatalogForm(); await loadSharedData(); return;
    }
    const existing=itemById(id); if(existing) Object.assign(existing,payload); else state.data.catalog.push(payload); saveLocal(); clearCatalogForm(); render();
  }

  async function deleteCatalogItem() {
    if (!isRoot() || !els.catalogItemId.value) return;
    const item=itemById(els.catalogItemId.value); if(!item || !confirm(`Remove ${item.name} from the requisition catalog? Existing stored units remain.`)) return;
    if (state.backendEnabled) {
      const { error }=await state.client.from("logistics_catalog").update({active:false}).eq("id",item.id); if(error) return api.flashMessage(error.message); clearCatalogForm(); await loadSharedData(); return;
    }
    item.active=false; saveLocal(); clearCatalogForm(); render();
  }

  function clearCatalogForm(){ if(!els.catalogItemForm)return; els.catalogItemId.value=""; els.catalogItemName.value=""; els.catalogItemCost.value=""; els.catalogItemCategory.value="ground"; }
  const slugify=value=>String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const camelToSnake=value=>value.replace(/[A-Z]/g,letter=>`_${letter.toLowerCase()}`);
  function addLedger(companyId,amount,action,note){state.data.ledger.unshift({id:api.uuid("ledger"),companyId,amount,action,note,createdAt:new Date().toISOString()});}

  async function syncSitesFromAtlas(showNotice=false) {
    if (!state.backendEnabled || !state.session || !isAdmin()) return;
    const calc=calculateSiteIncome();
    const { error }=await state.client.rpc("sync_requisition_sites", {p_sites:calc.rows});
    if(error){if(showNotice)api.flashMessage(error.message);return;}
    if(showNotice)api.flashMessage(`Synced ${calc.siteCount} Republic requisition sites to the shared weekly calculation.`);
  }

  function scheduleSiteSync(){ if(!state.backendEnabled||!state.session||!isAdmin())return; clearTimeout(state.syncTimer); state.syncTimer=setTimeout(()=>syncSitesFromAtlas(false),1200); }

  async function uploadAtlasTexture(file, bodyId) {
    if (!file || !state.backendEnabled || !state.client || !state.session || !isAdmin()) return null;
    const safeName = String(file.name || "planet-map.png").toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${bodyId}/${Date.now()}-${safeName}`;
    const { error } = await state.client.storage.from("atlas-textures").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    const { data } = state.client.storage.from("atlas-textures").getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async function deleteAtlasTextures(paths) {
    if (!state.backendEnabled || !state.client || !state.session || !isAdmin()) return;
    const cleanPaths = (paths || []).filter(Boolean);
    if (!cleanPaths.length) return;
    const { error } = await state.client.storage.from("atlas-textures").remove(cleanPaths);
    if (error) console.warn("Could not remove shared atlas textures.", error);
  }

  async function dataUrlToFile(dataUrl, filename) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  }

  async function prepareAtlasStateForSharedSave(sourceState) {
    const prepared = structuredClone(sourceState);
    for (const body of prepared.bodies || []) {
      if (body.textureDataUrl && !body.textureUrl) {
        const extension = body.textureDataUrl.startsWith("data:image/webp") ? "webp"
          : body.textureDataUrl.startsWith("data:image/jpeg") ? "jpg"
          : "png";
        const file = await dataUrlToFile(body.textureDataUrl, `${body.id}.${extension}`);
        const uploaded = await uploadAtlasTexture(file, body.id);
        if (!uploaded) {
          throw new Error(`Could not upload the texture for ${body.name || body.id}. Sign in with an Admin or Root Discord account before publishing shared atlas changes.`);
        }
        body.textureUrl = uploaded.url;
        body.texturePath = uploaded.path;
      }
      delete body.textureDataUrl;
    }
    return prepared;
  }

  async function saveAtlasDataNow() {
    if (!state.backendEnabled || !state.client || !state.session || state.atlasApplyingRemote) return;
    const role = state.profile?.app_role || "viewer";
    try {
      if (role === "admin" || role === "root") {
        const prepared = await prepareAtlasStateForSharedSave(api.getData());
        const { error } = await state.client.rpc("save_atlas_state", { p_state: prepared });
        if (error) throw error;
        const currentHasLocalTextures = (api.getData().bodies || []).some(body => body.textureDataUrl);
        if (currentHasLocalTextures) {
          state.atlasApplyingRemote = true;
          api.applySharedData(prepared);
          state.atlasApplyingRemote = false;
        }
      } else if (role === "command") {
        const tacticalPois = (api.getData().pois || []).filter(poi => poi.type === "tactical");
        const { error } = await state.client.rpc("save_command_tactical_pois", { p_pois: tacticalPois });
        if (error) throw error;
      }
    } catch (err) {
      console.warn("Shared atlas save failed.", err);
      api.flashMessage(`Shared atlas save failed: ${err.message || err}`);
    }
  }

  function scheduleAtlasSave() {
    if (!state.backendEnabled || !state.session || state.atlasApplyingRemote) return;
    const role = state.profile?.app_role || "viewer";
    if (!["command","admin","root"].includes(role)) return;
    clearTimeout(state.atlasSaveTimer);
    state.atlasSaveTimer = setTimeout(saveAtlasDataNow, 700);
  }

  async function loadSharedAtlasData() {
    if (!state.backendEnabled || !state.client) return;
    const { data, error } = await state.client.rpc("get_atlas_state");
    if (error) {
      console.warn("Could not load shared atlas state.", error);
      return;
    }
    if (data && Array.isArray(data.bodies) && data.bodies.length) {
      state.atlasApplyingRemote = true;
      api.applySharedData(data);
      state.atlasApplyingRemote = false;
      return;
    }
    if (state.session && ["admin","root"].includes(state.profile?.app_role || "")) {
      await saveAtlasDataNow();
    }
  }

  async function runWeeklyGrant() {
    if (!isAdmin()) return;
    if (state.backendEnabled) {
      await syncSitesFromAtlas(false);
      const { data,error }=await state.client.rpc("run_weekly_requisition",{p_force:true});
      if(error)return api.flashMessage(error.message);
      await loadSharedData();
      api.flashMessage(`Weekly grant calculated at ${data} RP per company and applied up to each company cap.`);
      return;
    }
    const calc=calculateSiteIncome();
    for (const company of state.data.companies) {
      const before = Number(company.points || 0);
      company.points = Math.min(capForCompany(company), before + calc.total);
      addLedger(company.id, company.points - before, "weekly_grant", `Base ${calc.base} + sites ${calc.sitePoints}`);
    }
    state.data.settings.lastWeeklyGrantAt=new Date().toISOString();
    saveLocal();
    render();
    api.flashMessage(`Weekly grant calculated at ${calc.total} RP per company and applied up to each company cap.`);
  }

  async function saveProfile(profileId,row) {
    if(!isRoot()||!state.backendEnabled)return;
    const app_role=row.querySelector("[data-profile-role]").value;
    const company_id=row.querySelector("[data-profile-company]").value||null;
    const {error}=await state.client.from("profiles").update({app_role,company_id}).eq("id",profileId);
    if(error)return api.flashMessage(error.message);
    await loadProfiles(); render();
  }

  async function signInDiscord(){if(!state.client)return; await state.client.auth.signInWithOAuth({provider:"discord",options:{redirectTo:window.CC_BACKEND_CONFIG.discordRedirectUrl||window.location.href}});}
  async function signOut(){if(!state.client)return; await state.client.auth.signOut();}

  async function initBackend() {
    const cfg=window.CC_BACKEND_CONFIG||{};
    if(!cfg.enabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase?.createClient){render();return;}
    state.backendEnabled=true;
    state.client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data}=await state.client.auth.getSession(); state.session=data.session;
    state.client.auth.onAuthStateChange(async(_event,session)=>{
      state.session=session;
      await loadProfile();
      if(!session){state.profile=null;api.applyAuthenticatedRole("viewer");}
      await Promise.all([loadSharedData(),loadSharedAtlasData()]);
    });
    await loadProfile();
    await Promise.all([loadSharedData(),loadSharedAtlasData()]);
  }

  async function loadProfile(){
    if(!state.session){state.profile=null;return;}
    const {data,error}=await state.client.from("profiles").select("*").eq("id",state.session.user.id).maybeSingle();
    if(error){console.warn(error);return;}
    state.profile=data;
    if(data?.app_role)api.applyAuthenticatedRole(data.app_role);
  }

  async function loadProfiles(){if(!state.backendEnabled||!isRoot())return;const{data,error}=await state.client.from("profiles").select("*").order("display_name");if(!error)state.profiles=data||[];}

  async function loadSharedData(){
    if(!state.client)return;
    state.loading=true;
    const [settingsRes,companiesRes,catalogRes,assetsRes]=await Promise.all([
      state.client.from("logistics_settings").select("*").eq("id",1).single(),
      state.client.from("logistics_companies").select("*").order("name"),
      state.client.from("logistics_catalog").select("*").eq("active",true).order("name"),
      state.client.from("logistics_assets").select("*").order("created_at")
    ]);
    const errors=[settingsRes.error,companiesRes.error,catalogRes.error,assetsRes.error].filter(Boolean); if(errors.length){console.warn(errors);state.loading=false;render();return;}
    const s=settingsRes.data;
    state.data.settings={defaultCompanyCap:s.default_company_cap,salvagePercent:s.salvage_percent,weeklyBase:s.weekly_base,resourceMinor:s.resource_minor,resourceStandard:s.resource_standard,resourceMajor:s.resource_major,productionMinor:s.production_minor,productionStandard:s.production_standard,productionMajor:s.production_major,lastWeeklyGrantAt:s.last_weekly_grant_at};
    state.data.companies=(companiesRes.data||[]).map(c=>({id:c.id,name:c.name,capOverride:c.cap_override,points:c.requisition_points}));
    state.data.catalog=(catalogRes.data||[]).map(i=>({id:i.id,category:i.category,name:i.name,cost:i.cost,active:i.active}));
    state.data.assets=(assetsRes.data||[]).map(a=>({id:a.id,companyId:a.company_id,catalogItemId:a.catalog_item_id,category:a.category,name:a.name,status:a.status,createdAt:a.created_at}));
    if(isRoot())await loadProfiles();
    setupRealtime(); state.loading=false; render();
  }

  function setupRealtime(){
    if(!state.backendEnabled||window.CC_BACKEND_CONFIG.realtime===false||state.channel)return;
    state.channel=state.client.channel("logistics-shared")
      .on("postgres_changes",{event:"*",schema:"public",table:"logistics_companies"},loadSharedData)
      .on("postgres_changes",{event:"*",schema:"public",table:"logistics_catalog"},loadSharedData)
      .on("postgres_changes",{event:"*",schema:"public",table:"logistics_assets"},loadSharedData)
      .on("postgres_changes",{event:"*",schema:"public",table:"logistics_settings"},loadSharedData)
      .on("postgres_changes",{event:"*",schema:"public",table:"atlas_public_state"},loadSharedAtlasData)
      .subscribe();
  }

  function bindEvents(){
    els.logisticsCategorySelect?.addEventListener("change",()=>{state.selectedCategory=els.logisticsCategorySelect.value;renderCatalog();});
    els.logisticsCompanySelect?.addEventListener("change",()=>{state.selectedCompanyId=els.logisticsCompanySelect.value;render();});
    els.logisticsCatalogList?.addEventListener("click",event=>{const button=event.target.closest("[data-requisition-item]");if(button)requisition(button.dataset.requisitionItem);});
    els.logisticsTrackerList?.addEventListener("change",event=>{const select=event.target.closest("[data-asset-status]");if(select)changeStatus(select.dataset.assetStatus,select.value);});
    els.logisticsTrackerList?.addEventListener("click",event=>{const repairBtn=event.target.closest("[data-repair-asset]");const salvageBtn=event.target.closest("[data-salvage-asset]");if(repairBtn)repair(repairBtn.dataset.repairAsset);if(salvageBtn)salvage(salvageBtn.dataset.salvageAsset);});
    els.setCompanyPointsForm?.addEventListener("submit",event=>{event.preventDefault();setCompanyPoints(els.setPointsCompanySelect.value,els.setCompanyPointsInput.value);});
    els.logisticsSettingsForm?.addEventListener("submit",saveSettings);
    els.companyConfigList?.addEventListener("click",event=>{const button=event.target.closest("[data-save-company-config]");if(button)saveCompanyConfig(button.dataset.saveCompanyConfig,button.closest("[data-company-config]"));});
    els.catalogItemForm?.addEventListener("submit",saveCatalogItem); els.catalogItemNewBtn?.addEventListener("click",clearCatalogForm); els.catalogItemDeleteBtn?.addEventListener("click",deleteCatalogItem);
    els.catalogConfigList?.addEventListener("click",event=>{const button=event.target.closest("[data-edit-catalog]");if(!button)return;const item=itemById(button.dataset.editCatalog);if(!item)return;els.catalogItemId.value=item.id;els.catalogItemCategory.value=item.category;els.catalogItemName.value=item.name;els.catalogItemCost.value=item.cost;});
    els.syncRequisitionSitesBtn?.addEventListener("click",()=>syncSitesFromAtlas(true)); els.runWeeklyGrantBtn?.addEventListener("click",runWeeklyGrant);
    els.accountAssignmentList?.addEventListener("click",event=>{const button=event.target.closest("[data-save-profile]");if(button)saveProfile(button.dataset.saveProfile,button.closest("[data-profile-row]"));});
    els.discordLoginBtn?.addEventListener("click",signInDiscord); els.accountLogoutBtn?.addEventListener("click",signOut);
  }

  bindEvents();
  window.CC_LOGISTICS={
    render,
    scheduleSiteSync,
    syncSitesFromAtlas,
    scheduleAtlasSave,
    saveAtlasDataNow,
    uploadAtlasTexture,
    deleteAtlasTextures,
    loadSharedAtlasData
  };
  render();
  initBackend();
})();
