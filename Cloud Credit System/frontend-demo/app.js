(function renderCloudCreditDemo() {
  const data = CLOUD_CREDIT_DEMO_DATA;

  const formatCredits = (value) => `${Number(value).toFixed(2)} cr`;
  const formatDate = (value) => new Date(value).toLocaleDateString();

  function renderHero() {
    document.getElementById("orgName").textContent = `Org: ${data.organization.name}`;
    document.getElementById("planName").textContent = `Plan: ${data.organization.plan}`;
    document.getElementById("renewalDate").textContent = `Renewal: ${formatDate(data.organization.renewalDate)}`;
  }

  function renderKPIs() {
    const cards = [
      { label: "Available Credits", value: formatCredits(data.balances.available) },
      { label: "Reserved Credits", value: formatCredits(data.balances.reserved) },
      { label: "Consumed This Month", value: formatCredits(data.balances.consumedMonth) },
      { label: "Expiring in < 7 days", value: formatCredits(data.balances.expiringSoon) }
    ];

    const grid = document.getElementById("kpiGrid");
    grid.innerHTML = cards
      .map(
        (card) =>
          `<article class="kpi"><div class="kpi__label">${card.label}</div><div class="kpi__value">${card.value}</div></article>`
      )
      .join("");
  }

  function renderBuckets() {
    const total = data.balances.buckets.reduce((sum, bucket) => sum + bucket.available, 0);
    const container = document.getElementById("bucketList");

    container.innerHTML = data.balances.buckets
      .map((bucket) => {
        const percentage = Math.max(3, (bucket.available / total) * 100);
        return `
          <article class="bucket">
            <div class="bucket__head">
              <span>${bucket.bucketType}</span>
              <span>${formatCredits(bucket.available)} | P${bucket.priority}</span>
            </div>
            <div class="bucket__bar"><div class="bucket__bar-fill" style="width:${percentage}%; background:${bucket.color};"></div></div>
            <div class="panel-subtitle">Expiry: ${formatDate(bucket.expiresAt)}</div>
          </article>
        `;
      })
      .join("");
  }

  function renderUsageChart() {
    const chart = document.getElementById("usageChart");
    const width = 760;
    const height = 220;
    const padding = 24;
    const values = data.usageTrend.map((point) => point.credits);
    const min = Math.min(...values) * 0.92;
    const max = Math.max(...values) * 1.03;

    const points = data.usageTrend.map((point, index) => {
      const x = padding + (index / (data.usageTrend.length - 1)) * (width - padding * 2);
      const y = padding + ((max - point.credits) / (max - min)) * (height - padding * 2);
      return `${x},${y}`;
    });

    const xLabels = data.usageTrend
      .filter((_, i) => i % 3 === 0 || i === data.usageTrend.length - 1)
      .map((point, i) => {
        const x = padding + ((i * 3) / (data.usageTrend.length - 1)) * (width - padding * 2);
        return `<text x="${Math.min(x, width - padding)}" y="208" class="axis-label">${point.day}</text>`;
      })
      .join("");

    chart.innerHTML = `
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#005f73" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#005f73" stop-opacity="0.03"/>
        </linearGradient>
      </defs>
      <polyline points="${points.join(" ")}" fill="none" stroke="#005f73" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <polygon points="${points.join(" ")} ${width - padding},${height - padding} ${padding},${height - padding}" fill="url(#areaGrad)"/>
      ${xLabels}
    `;
  }

  function renderServiceMix() {
    const max = Math.max(...data.serviceMix.map((entry) => entry.credits));
    const container = document.getElementById("serviceBars");

    container.innerHTML = data.serviceMix
      .map((entry) => {
        const width = (entry.credits / max) * 100;
        return `
          <div class="service-row">
            <span>${entry.service}</span>
            <div class="service-row__track"><div class="service-row__fill" style="width:${width}%;"></div></div>
            <span>${formatCredits(entry.credits)}</span>
          </div>
        `;
      })
      .join("");
  }

  function computeEstimate(service, units, priority, region) {
    const profile = data.pricingProfiles[service];
    const regionM = data.regionMultiplier[region];
    const priorityM = data.priorityMultiplier[priority];
    const discount = data.organization.planDiscount;

    const avg = profile.base + units * profile.unitRate * regionM * priorityM * discount;
    return {
      low: avg * 0.88,
      avg,
      high: avg * 1.2,
      reserve: avg * 1.25,
      rateInfo: `${profile.unitRate}/unit`
    };
  }

  function renderEstimateUI() {
    const serviceSelect = document.getElementById("serviceSelect");
    const prioritySelect = document.getElementById("prioritySelect");
    const regionSelect = document.getElementById("regionSelect");

    serviceSelect.innerHTML = Object.keys(data.pricingProfiles)
      .map((key) => `<option value="${key}">${key}</option>`)
      .join("");

    prioritySelect.innerHTML = Object.keys(data.priorityMultiplier)
      .map((key) => `<option value="${key}">${key}</option>`)
      .join("");

    regionSelect.innerHTML = Object.keys(data.regionMultiplier)
      .map((key) => `<option value="${key}">${key}</option>`)
      .join("");

    const form = document.getElementById("estimateForm");

    const renderResults = (estimate) => {
      const results = document.getElementById("estimateResults");
      results.innerHTML = `
        <div class="result-card">Low<strong>${formatCredits(estimate.low)}</strong></div>
        <div class="result-card">Average<strong>${formatCredits(estimate.avg)}</strong></div>
        <div class="result-card">High<strong>${formatCredits(estimate.high)}</strong></div>
        <div class="result-card">Suggested Reserve<strong>${formatCredits(estimate.reserve)}</strong></div>
      `;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const service = String(formData.get("service"));
      const units = Number(formData.get("units"));
      const priority = String(formData.get("priority"));
      const region = String(formData.get("region"));
      const estimate = computeEstimate(service, units, priority, region);
      renderResults(estimate);
      window.lastEstimate = { service, units, priority, region, estimate };
    });

    const initial = computeEstimate("gpu_jobs", 12000, "priority", "eu-west");
    renderResults(initial);
    window.lastEstimate = {
      service: "gpu_jobs",
      units: 12000,
      priority: "priority",
      region: "eu-west",
      estimate: initial
    };
  }

  function renderWorkflowSimulator() {
    const button = document.getElementById("simulateRun");
    const feed = document.getElementById("workflowFeed");

    const pushLog = (text) => {
      const line = document.createElement("li");
      line.textContent = text;
      feed.prepend(line);
      if (feed.children.length > 9) {
        feed.removeChild(feed.lastChild);
      }
    };

    button.addEventListener("click", () => {
      const run = window.lastEstimate;
      const holdKey = `hold_${Math.floor(Math.random() * 9000) + 1000}`;
      const reserve = run.estimate.reserve;
      const actual = run.estimate.avg * (0.82 + Math.random() * 0.24);
      const refund = Math.max(0, reserve - actual);

      pushLog(`${new Date().toLocaleTimeString()} - Reserved ${formatCredits(reserve)} for ${run.service} (${holdKey})`);
      pushLog(`${new Date().toLocaleTimeString()} - Job executed with actual ${formatCredits(actual)} across ${run.units} units`);
      pushLog(`${new Date().toLocaleTimeString()} - Settled ${formatCredits(actual)}, refunded ${formatCredits(refund)}`);
    });
  }

  function renderTransactions() {
    const rows = document.getElementById("transactionRows");
    rows.innerHTML = data.transactions
      .map((txn) => {
        const amountClass = txn.amount < 0 ? "amount-negative" : "amount-positive";
        const amountLabel = txn.amount > 0 ? `+${txn.amount.toFixed(2)}` : txn.amount.toFixed(2);
        return `
          <tr>
            <td>${txn.time}</td>
            <td>${txn.type}</td>
            <td>${txn.project}</td>
            <td class="${amountClass}">${amountLabel}</td>
            <td>${txn.status}</td>
            <td>${txn.idempotencyKey}</td>
          </tr>
        `;
      })
      .join("");
  }

  renderHero();
  renderKPIs();
  renderBuckets();
  renderUsageChart();
  renderServiceMix();
  renderEstimateUI();
  renderWorkflowSimulator();
  renderTransactions();
})();
