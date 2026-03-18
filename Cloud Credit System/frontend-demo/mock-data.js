const CLOUD_CREDIT_DEMO_DATA = {
  organization: {
    id: "org_2048",
    name: "QStudio Labs",
    plan: "Enterprise Compute",
    renewalDate: "2026-04-01",
    overageEnabled: false,
    planDiscount: 0.85
  },
  balances: {
    available: 8475.45,
    reserved: 632.1,
    consumedMonth: 12793.66,
    expiringSoon: 920.0,
    buckets: [
      {
        bucketType: "trial",
        available: 400.0,
        reserved: 0,
        expiresAt: "2026-03-18",
        priority: 10,
        color: "#ff7a59"
      },
      {
        bucketType: "subscription",
        available: 5250.5,
        reserved: 480.0,
        expiresAt: "2026-04-01",
        priority: 20,
        color: "#f9b934"
      },
      {
        bucketType: "topup",
        available: 2304.95,
        reserved: 152.1,
        expiresAt: "2026-08-01",
        priority: 30,
        color: "#00a896"
      },
      {
        bucketType: "promo",
        available: 520.0,
        reserved: 0,
        expiresAt: "2026-05-15",
        priority: 15,
        color: "#2e86ab"
      }
    ]
  },
  usageTrend: [
    { day: "Mar 1", credits: 512 },
    { day: "Mar 2", credits: 620 },
    { day: "Mar 3", credits: 590 },
    { day: "Mar 4", credits: 710 },
    { day: "Mar 5", credits: 688 },
    { day: "Mar 6", credits: 742 },
    { day: "Mar 7", credits: 695 },
    { day: "Mar 8", credits: 820 },
    { day: "Mar 9", credits: 774 },
    { day: "Mar 10", credits: 862 },
    { day: "Mar 11", credits: 834 },
    { day: "Mar 12", credits: 910 },
    { day: "Mar 13", credits: 880 },
    { day: "Mar 14", credits: 945 }
  ],
  serviceMix: [
    { service: "gpu_jobs", credits: 4980.25 },
    { service: "cpu_jobs", credits: 3014.86 },
    { service: "api_usage", credits: 1875.43 },
    { service: "storage", credits: 1312.58 },
    { service: "simulations", credits: 1610.54 }
  ],
  pricingProfiles: {
    api_usage: { base: 0.2, unitRate: 0.00012 },
    cpu_jobs: { base: 0.5, unitRate: 0.0012 },
    gpu_jobs: { base: 1.2, unitRate: 0.0048 },
    simulations: { base: 1.0, unitRate: 0.0026 },
    storage: { base: 0.1, unitRate: 0.0004 }
  },
  regionMultiplier: {
    "us-east": 1.0,
    "eu-west": 1.12,
    "ap-south": 1.19
  },
  priorityMultiplier: {
    standard: 1.0,
    priority: 1.25,
    urgent: 1.45
  },
  transactions: [
    {
      time: "2026-03-14 11:12:09",
      type: "reserve",
      project: "forecast-lab",
      amount: -220.0,
      status: "posted",
      idempotencyKey: "idem_res_1192"
    },
    {
      time: "2026-03-14 11:21:44",
      type: "settle",
      project: "forecast-lab",
      amount: -184.34,
      status: "posted",
      idempotencyKey: "idem_set_1192"
    },
    {
      time: "2026-03-14 11:21:45",
      type: "refund",
      project: "forecast-lab",
      amount: 35.66,
      status: "posted",
      idempotencyKey: "idem_ref_1192"
    },
    {
      time: "2026-03-14 10:03:22",
      type: "grant",
      project: "organization",
      amount: 500.0,
      status: "posted",
      idempotencyKey: "admin_grant_778"
    },
    {
      time: "2026-03-14 09:46:10",
      type: "reserve",
      project: "genomics-batch",
      amount: -402.0,
      status: "posted",
      idempotencyKey: "idem_res_1188"
    },
    {
      time: "2026-03-14 09:57:04",
      type: "settle",
      project: "genomics-batch",
      amount: -390.22,
      status: "posted",
      idempotencyKey: "idem_set_1188"
    }
  ]
};
