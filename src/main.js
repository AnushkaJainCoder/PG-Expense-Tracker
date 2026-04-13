import './style.css'
import seedData from './seed-data.json'

const STORAGE_KEY = 'pg-rent-ledger-v1'

function uid() {
  return crypto.randomUUID?.() ?? `t-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { tenants: [], records: {} }
    const data = JSON.parse(raw)
    return {
      tenants: Array.isArray(data.tenants) ? data.tenants : [],
      records: data.records && typeof data.records === 'object' ? data.records : {},
    }
  } catch {
    return { tenants: [], records: {} }
  }
}

function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ tenants: state.tenants, records: state.records })
  )
}

function monthKeyFromInput(value) {
  return value
}

function recordKey(tenantId, yyyymm) {
  return `${tenantId}:${yyyymm}`
}

function todayISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatCurrency(n) {
  const x = Number(n)
  if (Number.isNaN(x)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(x)
}

const hadStoredData = localStorage.getItem(STORAGE_KEY) !== null
let state = loadState()
if (!hadStoredData) {
  state = {
    tenants: structuredClone(seedData.tenants),
    records: structuredClone(seedData.records),
  }
  saveState(state)
}
let activeTab = 'rent'
/** @type {null | 'paid' | 'pending'} */
let rentStatusFilter = null
let selectedMonth = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})()
let tenantSearchQuery = ''
let refocusTenantSearchAfterRender = false

function matchesTenantSearch(t, q) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const name = String(t.name).toLowerCase()
  const room = String(t.room).toLowerCase()
  const rent = String(t.monthlyRent ?? '')
  return name.includes(needle) || room.includes(needle) || rent.includes(needle)
}

function getRecord(tenantId, month) {
  return state.records[recordKey(tenantId, month)] ?? {
    paid: false,
    paidOn: '',
    method: 'Cash',
    note: '',
  }
}

function setRecord(tenantId, month, patch) {
  const key = recordKey(tenantId, month)
  const prev = state.records[key] ?? {}
  state.records[key] = { ...prev, ...patch }
  saveState(state)
  render()
}

function render() {
  const app = document.querySelector('#app')
  const tenants = state.tenants

  const month = selectedMonth
  let paidCount = 0
  let pendingCount = 0
  let pendingTotal = 0

  for (const t of tenants) {
    const r = getRecord(t.id, month)
    const rent = Number(t.monthlyRent) || 0
    if (r.paid) paidCount += 1
    else {
      pendingCount += 1
      pendingTotal += rent
    }
  }

  const filteredTenants = tenants.filter((t) => {
    if (!rentStatusFilter) return true
    const paid = getRecord(t.id, month).paid
    if (rentStatusFilter === 'paid') return paid
    return !paid
  })
  const rentTableTenants = filteredTenants.filter((t) =>
    matchesTenantSearch(t, tenantSearchQuery)
  )
  const tenantsListFiltered = tenants.filter((t) => matchesTenantSearch(t, tenantSearchQuery))

  app.innerHTML = `
    <header class="app-header">
      <p class="app-eyebrow">Rent ledger</p>
      <h1>SVS Womens Pg</h1>
      <p class="app-tagline">Track who paid each month for your residents. Stored only in this browser.</p>
    </header>

    <div class="toolbar card-surface">
      <div class="tabs" role="tablist" aria-label="Main sections">
        <button type="button" role="tab" aria-selected="${activeTab === 'rent'}" data-tab="rent">Monthly rent</button>
        <button type="button" role="tab" aria-selected="${activeTab === 'tenants'}" data-tab="tenants">Tenants</button>
      </div>
      <div class="search-row">
        <label class="search-field">
          <span class="search-field-label">Search tenants</span>
          <input
            type="search"
            id="tenant-search"
            placeholder="Name, room, or rent amount…"
            autocomplete="off"
            enterkeyhint="search"
            value="${escapeHtml(tenantSearchQuery)}"
          />
        </label>
      </div>
    </div>

    ${
      activeTab === 'rent'
        ? `
    <section class="panel-main" aria-label="Monthly rent">
      <div class="panel-intro">
        <h2 class="panel-title">${formatMonthHeading(month)}</h2>
        <div class="row month-row">
          <label class="month-label">Month
            <input type="month" id="month-picker" value="${month}" />
          </label>
        </div>
      </div>
      <div class="stats" role="group" aria-label="Filter tenants by payment status">
        <button type="button" class="stat stat-filter" data-filter="paid" aria-pressed="${rentStatusFilter === 'paid'}" aria-label="Show paid tenants only">
          <strong>${paidCount}</strong><span>Paid</span>
        </button>
        <button type="button" class="stat stat-filter" data-filter="pending" aria-pressed="${rentStatusFilter === 'pending'}" aria-label="Show tenants who have not paid">
          <strong>${pendingCount}</strong><span>Not paid</span>
        </button>
        <button type="button" class="stat stat-filter" data-filter="pending" aria-pressed="${rentStatusFilter === 'pending'}" aria-label="Show tenants with pending rent (same as not paid)">
          <strong>${formatCurrency(pendingTotal)}</strong><span>Pending total</span>
        </button>
      </div>
      ${
        tenants.length === 0
          ? `<p class="empty">Add tenants first (open the <strong>Tenants</strong> tab).</p>`
          : filteredTenants.length === 0
            ? `<p class="empty">No tenants match this filter. Click the same card again to show everyone.</p>`
            : rentTableTenants.length === 0
              ? `<p class="empty">No tenants match your search. Clear the search box or try another name or room.</p>`
              : `
      <div class="table-wrap card-inset">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Room</th>
              <th>Rent</th>
              <th>Status</th>
              <th>Paid on</th>
              <th>Method</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rentTableTenants
              .map((t) => {
                const r = getRecord(t.id, month)
                const rent = Number(t.monthlyRent) || 0
                return `
              <tr class="rent-row" data-tenant="${t.id}">
                <td data-label="Tenant">${escapeHtml(t.name)}</td>
                <td data-label="Room">${escapeHtml(t.room)}</td>
                <td data-label="Rent">${formatCurrency(rent)}</td>
                <td data-label="Status">
                  ${
                    r.paid
                      ? `<span class="badge badge-paid">Paid</span>`
                      : `<span class="badge badge-pending">Pending</span>`
                  }
                </td>
                <td data-label="Paid on">
                  <input type="date" class="js-paid-on" data-tenant="${t.id}" value="${r.paidOn || ''}" aria-label="Paid on for ${escapeHtml(t.name)}" title="Tap to choose date — saves as paid" />
                </td>
                <td data-label="Method">
                  <select class="js-method" data-tenant="${t.id}" aria-label="Payment method for ${escapeHtml(t.name)}">
                    ${['Cash', 'UPI', 'Bank', 'Other']
                      .map(
                        (m) =>
                          `<option value="${m}" ${r.method === m ? 'selected' : ''}>${m}</option>`
                      )
                      .join('')}
                  </select>
                </td>
                <td class="td-actions">
                  ${
                    r.paid
                      ? `<button type="button" class="btn-ghost btn-touch js-unpaid" data-tenant="${t.id}">Mark unpaid</button>`
                      : `<button type="button" class="btn btn-touch js-paid" data-tenant="${t.id}">Mark paid (today)</button>`
                  }
                </td>
              </tr>`
              })
              .join('')}
          </tbody>
        </table>
      </div>`
      }
    </section>
    `
        : `
    <section class="panel-main" aria-label="Tenants">
      <h2 class="panel-title panel-title-sub">Add tenant</h2>
      <form class="tenant-form card-inset" id="add-tenant-form">
        <label>Name
          <input name="name" required autocomplete="name" placeholder="e.g. Priya Sharma" />
        </label>
        <label>Room / bed
          <input name="room" required placeholder="e.g. 201-A" />
        </label>
        <label>Monthly rent (₹)
          <input name="monthlyRent" type="number" min="0" step="1" required placeholder="8000" />
        </label>
        <button type="submit" class="btn btn-touch btn-block-sm">Add tenant</button>
      </form>
      <h2 class="panel-title panel-title-sub tenant-list-heading">Your tenants</h2>
      ${
        tenants.length === 0
          ? `<p class="empty">No tenants yet. Use the form above.</p>`
          : tenantsListFiltered.length === 0
            ? `<p class="empty">No tenants match your search.</p>`
            : `
      <ul class="tenant-list">
        ${tenantsListFiltered
          .map(
            (t) => `
          <li class="tenant-card" data-tenant="${t.id}">
            <span class="tenant-card-name"><strong>${escapeHtml(t.name)}</strong></span>
            <span class="tenant-card-room muted">${escapeHtml(t.room)}</span>
            <span class="tenant-card-rent">${formatCurrency(t.monthlyRent)}</span>
            <div class="tenant-actions">
              <button type="button" class="btn-danger btn-touch js-delete-tenant" data-tenant="${t.id}">Remove</button>
            </div>
          </li>`
          )
          .join('')}
      </ul>`
      }
    </section>
    `
    }

    <footer class="app-footer card-surface">
      <div class="footer-actions">
        <button type="button" class="btn-secondary btn-touch" id="sample-btn">Load sample data</button>
        <button type="button" class="btn-secondary btn-touch" id="export-btn">Download backup</button>
        <label class="footer-import muted">Restore backup
          <input type="file" id="import-file" accept="application/json" class="input-file-touch" />
        </label>
      </div>
      <p class="app-tip muted">On your phone: add this site to your home screen for quick access. Download a backup before clearing browser data.</p>
    </footer>
  `

  bindEvents()
}

function formatMonthHeading(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bindEvents() {
  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab
      render()
    })
  })

  const monthPicker = document.querySelector('#month-picker')
  if (monthPicker) {
    monthPicker.addEventListener('change', () => {
      selectedMonth = monthKeyFromInput(monthPicker.value)
      rentStatusFilter = null
      render()
    })
  }

  document.querySelectorAll('.stat-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = /** @type {'paid' | 'pending'} */ (btn.dataset.filter)
      rentStatusFilter = rentStatusFilter === next ? null : next
      render()
    })
  })

  document.querySelectorAll('.js-paid').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tenant
      setRecord(id, selectedMonth, {
        paid: true,
        paidOn: todayISODate(),
        method: getRecord(id, selectedMonth).method || 'Cash',
      })
    })
  })

  document.querySelectorAll('.js-unpaid').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tenant
      setRecord(id, selectedMonth, { paid: false, paidOn: '', note: '' })
    })
  })

  document.querySelectorAll('.js-paid-on').forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.dataset.tenant
      const v = input.value.trim()
      if (v) {
        const prev = getRecord(id, selectedMonth)
        setRecord(id, selectedMonth, {
          paid: true,
          paidOn: v,
          method: prev.method || 'Cash',
        })
      } else {
        setRecord(id, selectedMonth, { paid: false, paidOn: '', note: '' })
      }
    })
  })

  document.querySelectorAll('.js-method').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = sel.dataset.tenant
      setRecord(id, selectedMonth, { method: sel.value })
    })
  })

  const form = document.querySelector('#add-tenant-form')
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const fd = new FormData(form)
      const name = String(fd.get('name') || '').trim()
      const room = String(fd.get('room') || '').trim()
      const monthlyRent = Number(fd.get('monthlyRent'))
      if (!name || !room || Number.isNaN(monthlyRent) || monthlyRent < 0) return
      state.tenants.push({ id: uid(), name, room, monthlyRent })
      saveState(state)
      form.reset()
      render()
    })
  }

  document.querySelectorAll('.js-delete-tenant').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tenant
      if (!confirm('Remove this tenant from the list? Rent history for past months will stay in backup only if you exported before.')) return
      state.tenants = state.tenants.filter((t) => t.id !== id)
      const prefix = `${id}:`
      for (const key of Object.keys(state.records)) {
        if (key.startsWith(prefix)) delete state.records[key]
      }
      saveState(state)
      render()
    })
  })

  const sampleBtn = document.querySelector('#sample-btn')
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      if (
        !confirm(
          'Replace all current tenants and payments with built-in sample data? This cannot be undone (unless you have a backup).'
        )
      )
        return
      state = {
        tenants: structuredClone(seedData.tenants),
        records: structuredClone(seedData.records),
      }
      saveState(state)
      render()
    })
  }

  const exportBtn = document.querySelector('#export-btn')
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `pg-rent-backup-${selectedMonth}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  const importFile = document.querySelector('#import-file')
  if (importFile) {
    importFile.addEventListener('change', async () => {
      const file = importFile.files?.[0]
      importFile.value = ''
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!Array.isArray(data.tenants) || typeof data.records !== 'object') {
          alert('Invalid backup file.')
          return
        }
        state = {
          tenants: data.tenants,
          records: data.records,
        }
        saveState(state)
        render()
      } catch {
        alert('Could not read that file.')
      }
    })
  }

  const tenantSearchInput = document.querySelector('#tenant-search')
  if (tenantSearchInput) {
    tenantSearchInput.addEventListener('input', (e) => {
      tenantSearchQuery = /** @type {HTMLInputElement} */ (e.target).value
      refocusTenantSearchAfterRender = true
      render()
    })
  }

  if (refocusTenantSearchAfterRender) {
    refocusTenantSearchAfterRender = false
    const el = document.querySelector('#tenant-search')
    if (el) {
      /** @type {HTMLInputElement} */ (el).focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }
}

render()
