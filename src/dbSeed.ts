import { DBState } from './types.js';

export const INITIAL_DB_STATE: DBState = {
  accounts: [
    {
      id: 'acc_acme',
      name: 'Acme Corp',
      domain: 'acme.com',
      logoColor: 'from-amber-500 to-orange-600',
      industry: 'Manufacturing & Industrial IoT',
      size: 'Enterprise (10,000+ employees)',
      employees: 12500,
      relationshipHealth: 'good',
      likelyPainPoints: [
        'Outdated legacy manufacturing ERP sync failures',
        'High latency in sensor-to-cloud data reporting pipelines',
        'Lack of real-time supply chain capacity forecasts'
      ],
      competitorMentions: ['IndustrialSystems Inc', 'FactoryAuto Suite'],
      suggestedOutreach: 'Focus on demonstrating our zero-latency API adapter capabilities and direct ERP mapping overlays.',
      summary: 'High-value industrial manufacturing conglomerate looking to modernize their global factory floor signaling. Currently evaluating our core IoT messaging layer but pushing back slightly on enterprise support bundle pricing.'
    },
    {
      id: 'acc_northstar',
      name: 'Northstar Health',
      domain: 'northstarhealth.org',
      logoColor: 'from-emerald-500 to-teal-600',
      industry: 'Healthcare Services & Providers',
      size: 'Large Enterprise (5,000+ employees)',
      employees: 6400,
      relationshipHealth: 'fair',
      likelyPainPoints: [
        'Strict HIPAA and HITRUST compliance overheads',
        'Patient data fragmentation across multiple EHR instances',
        'High manual overhead on billing verification checks'
      ],
      competitorMentions: ['MedConnect', 'CareFlow Solutions'],
      suggestedOutreach: 'Emphasize our pre-configured HIPAA compliance vault and direct integration with Epic systems.',
      summary: 'Regional healthcare system looking to integrate a unified patient portal dispatch engine. Currently stalled on our standard security assessment. Awaiting complete clearance of the SOC2 Type II detail annex.'
    },
    {
      id: 'acc_vertex',
      name: 'Vertex Logistics',
      domain: 'vertexlogistics.com',
      logoColor: 'from-blue-500 to-sky-600',
      industry: 'Transportation & Logistics',
      size: 'Mid-Market (1,200 employees)',
      employees: 1200,
      relationshipHealth: 'good',
      likelyPainPoints: [
        'Routing optimization inefficiencies on final-mile deliveries',
        'Inability to track temperature controls dynamically in transit',
        'High vendor onboarding delays'
      ],
      competitorMentions: ['LogiTrack Premium', 'SmartFleet Pro'],
      suggestedOutreach: 'Highlight our dynamic routing dispatch models and temperature telemetry integrations.',
      summary: 'Fast-growing transportation provider seeking automated logistics dispatch system. Champion is highly aligned and actively pushing but we are missing formal introduction to their procurement team.'
    },
    {
      id: 'acc_bluepeak',
      name: 'BluePeak Systems',
      domain: 'bluepeaksystems.com',
      logoColor: 'from-indigo-500 to-violet-600',
      industry: 'Enterprise Software & Cloud Sec',
      size: 'SaaS Scaleup (800 employees)',
      employees: 800,
      relationshipHealth: 'poor',
      likelyPainPoints: [
        'High cloud-spend waste on idle containers',
        'Slow incident containment metrics across multi-cloud environments',
        'Complex IAM role management scaling overhead'
      ],
      competitorMentions: ['CloudControl Systems', 'SentinelOps'],
      suggestedOutreach: 'Provide a comparative breakdown showing our 40% superior cost containment metrics against SentinelFlow.',
      summary: 'Cybersecurity scaleup looking for proactive resource optimization. Active pricing battle with a major incumbent competitor who has introduced aggressive discount structures.'
    },
    {
      id: 'acc_orion',
      name: 'Orion Retail',
      domain: 'orionretail.ai',
      logoColor: 'from-pink-500 to-rose-600',
      industry: 'E-commerce & Smart Retail',
      size: 'Enterprise (8,000+ employees)',
      employees: 8200,
      relationshipHealth: 'fair',
      likelyPainPoints: [
        'Cart abandonment spikes on localized checkouts',
        'Lack of micro-segmented buyer cohorts for seasonal promotions',
        'Inventory desynchronization across global fulfillment centers'
      ],
      competitorMentions: ['ShopPulse', 'RetailNext'],
      suggestedOutreach: 'Propose a workshop centered on our cohort segmentation engine and real-time checkout adapters.',
      summary: 'Traditional retailer transitioning rapidly to omni-channel e-commerce. Great initial engagement, though we have not secured access to a clear decision-maker or budget owner.'
    },
    {
      id: 'acc_deltaforge',
      name: 'DeltaForge Solutions',
      domain: 'deltaforge.io',
      logoColor: 'from-red-500 to-rose-700',
      industry: 'Defense & Aerospace Componentry',
      size: 'Mid-Market (450 employees)',
      employees: 450,
      relationshipHealth: 'good',
      likelyPainPoints: [
        'Complex ITAR audit readiness reporting delays',
        'Supplier quality audit trace manual data capture',
        'Subcontractor collaboration security clearances'
      ],
      competitorMentions: ['AeroGov Suites'],
      suggestedOutreach: 'Focus outreach on our automated export compliance reporting logs.',
      summary: 'Aerospace manufacturing sub-system provider. Late-stage negotiations are underway, but the standard defense-industry legal review has slowed down the contract execution schedule.'
    },
    {
      id: 'acc_innovate',
      name: 'Innovate Tech',
      domain: 'innovatetech.com',
      logoColor: 'from-purple-500 to-pink-600',
      industry: 'Digital Design & Creative Tools',
      size: 'Enterprise (2,500 employees)',
      employees: 2500,
      relationshipHealth: 'good',
      likelyPainPoints: [
        'Collaborative digital canvas frame-rate stuttering',
        'Storage tiering costs on active raw graphic files',
        'Complex localized tax processing during checkout'
      ],
      competitorMentions: ['CanvasCloud', 'FigmaEnterprise'],
      suggestedOutreach: 'Present our high-bandwidth localized CDN caching strategy and regional tax API.',
      summary: 'Global design tool vendor seeking global tax localization solution. In late-stage talks, focusing on alignment around commercial terms.'
    },
    {
      id: 'acc_zenith',
      name: 'Zenith Finance',
      domain: 'zenithfinance.net',
      logoColor: 'from-slate-600 to-slate-800',
      industry: 'Investment Banking & Wealth Prep',
      size: 'Large Enterprise (15,000 employees)',
      employees: 15000,
      relationshipHealth: 'good',
      likelyPainPoints: [
        'Fiduciary audit trail manual verification bottlenecks',
        'Client statement preparation reporting lag',
        'Portfolio risk alert delay during market hours'
      ],
      competitorMentions: ['FinaTrack', 'WealthStack Pro'],
      suggestedOutreach: 'Emphasize our low-latency audit trail verification index and automated statement generator.',
      summary: 'Investment firm evaluating automated compliance audit tools. Initial discovery is complete, positive reception of our capabilities.'
    }
  ],
  deals: [
    {
      id: 'deal_acme_iot',
      name: 'IoT Floor Signals Overlay',
      accountId: 'acc_acme',
      stage: 'Negotiation',
      value: 280000,
      closeDate: '2026-08-15',
      healthScore: 78,
      owner: 'Sarah Connor',
      topRisk: 'Pricing pushback on premium support layer SLA limits.',
      lastActivity: 'Negotiation meeting on core pricing tiers conducted today morning.',
      nextStep: 'Present matching support Tier proposal with optimized SLAs on Thursday.',
      summary: 'High-value opportunity to wire up 14 Acme global factories with Proffer signaling platform. Acme wants to cut the enterprise package tier standard price by 15%.',
      unresolvedObjectionsCount: 1,
      stakeholderIds: ['stk_acme_vp', 'stk_acme_eng_lead', 'stk_acme_procure'],
      objectionIds: ['obj_acme_pricing'],
      taskIds: ['task_acme_sla'],
      timelineIds: ['act_acme_price_call', 'act_acme_ref'],
      competitiorList: ['IndustrialSystems Inc']
    },
    {
      id: 'deal_northstar_portal',
      name: 'Unified Patient Dispatch',
      accountId: 'acc_northstar',
      stage: 'Evaluation',
      value: 420000,
      closeDate: '2026-10-10',
      healthScore: 61,
      owner: 'Marcus Aurelius',
      topRisk: 'Pending final compliance and SOC2 report vetting by IT security board.',
      lastActivity: 'Security assessment questionnaire submitted back with extensive detail.',
      nextStep: 'Schedule a alignment meeting between our Chief InfoSec Officer and Northstar audit panel.',
      summary: 'Deal encompasses full patient dispatch modern rails. Highly structured system. Waiting on audit and questionnaire verification.',
      unresolvedObjectionsCount: 1,
      stakeholderIds: ['stk_northstar_cio', 'stk_northstar_sec'],
      objectionIds: ['obj_northstar_security'],
      taskIds: ['task_northstar_meeting'],
      timelineIds: ['act_northstar_sec'],
      competitiorList: ['MedConnect']
    },
    {
      id: 'deal_vertex_fleet',
      name: 'Dynamic Fleet Routing Engine',
      accountId: 'acc_vertex',
      stage: 'Proposal',
      value: 195000,
      closeDate: '2026-07-22',
      healthScore: 85,
      owner: 'Elena Rostova',
      topRisk: 'No clear communication channel established with corporate procurement group.',
      lastActivity: 'Presented full routing pilot deck to operations council, got high scores.',
      nextStep: 'Ask champion to introduce procurement or legal team.',
      summary: 'Deal involves tracking and final mile optimization. Champion is thrilled with the result of our pilot, stating they will sponsor the project fully.',
      unresolvedObjectionsCount: 0,
      stakeholderIds: ['stk_vertex_vp', 'stk_vertex_procure'],
      objectionIds: [],
      taskIds: ['task_vertex_intro'],
      timelineIds: ['act_vertex_pilot'],
      competitiorList: ['LogiTrack Premium']
    },
    {
      id: 'deal_bluepeak_optimize',
      name: 'Multi-Cloud Optimization Suite',
      accountId: 'acc_bluepeak',
      stage: 'Stalled',
      value: 150000,
      closeDate: '2026-07-01',
      healthScore: 35,
      owner: 'Sarah Connor',
      topRisk: 'Fierce competitor SentinelOps bidding at a extremely discounted rate.',
      lastActivity: 'Received rival bid warning from our internal advocate in the engineering group.',
      nextStep: 'Draft executive summary with ROI savings calculation vs competitors.',
      summary: 'Incumbent was previously secure but BluePeak requested budget compression. The competitor discounted their renewal by 35%, placing severe threat on our premium-tier bid.',
      unresolvedObjectionsCount: 1,
      stakeholderIds: ['stk_bluepeak_cto', 'stk_bluepeak_eng'],
      objectionIds: ['obj_bluepeak_competitor'],
      taskIds: ['task_bluepeak_roi'],
      timelineIds: ['act_bluepeak_rival'],
      competitiorList: ['SentinelOps']
    },
    {
      id: 'deal_orion_cohort',
      name: 'Real-time Segment Engine',
      accountId: 'acc_orion',
      stage: 'Discovery',
      value: 310000,
      closeDate: '2026-11-30',
      healthScore: 50,
      owner: 'Marcus Aurelius',
      topRisk: 'No clear senior decision-maker has sponsored the project formally.',
      lastActivity: 'Engaged with individual team managers who gave positive feedback.',
      nextStep: 'Identify and reach out to Category VP of Retail Engineering.',
      summary: 'Traditional brick-and-mortar provider pivoting to digital optimization. While individual engineers love Proffer, they do not have authority to request or approve large enterprise budget segments.',
      unresolvedObjectionsCount: 0,
      stakeholderIds: ['stk_orion_mgr', 'stk_orion_vp'],
      objectionIds: [],
      taskIds: ['task_orion_find_vp'],
      timelineIds: ['act_orion_discovery'],
      competitiorList: []
    },
    {
      id: 'deal_deltaforge_itar',
      name: 'ITAR Compliance Overlay',
      accountId: 'acc_deltaforge',
      stage: 'Late stage',
      value: 220000,
      closeDate: '2026-06-30',
      healthScore: 90,
      owner: 'Elena Rostova',
      topRisk: 'Standard security-sensitive legal review buffer taking longer than initial timeline.',
      lastActivity: 'Contract draft sent over with complete legal sign-off from our side.',
      nextStep: 'Request brief sync with DeltaForge GC to align on wording modifications.',
      summary: 'Very high health deal, fully supported by the aerospace operational units. Delayed only by the regulatory complexity and slow timeline of internal legal council reviews.',
      unresolvedObjectionsCount: 1,
      stakeholderIds: ['stk_deltaforge_ops', 'stk_deltaforge_gc'],
      objectionIds: ['obj_deltaforge_itar'],
      taskIds: ['task_deltaforge_gc_sync'],
      timelineIds: ['act_deltaforge_legal'],
      competitiorList: []
    },
    {
      id: 'deal_innovate_tax',
      name: 'Global Tax Localization Portal',
      accountId: 'acc_innovate',
      stage: 'Late stage',
      value: 175000,
      closeDate: '2026-06-25',
      healthScore: 88,
      owner: 'Sarah Connor',
      topRisk: 'Minor commercial misalignment on multi-year payment schedule.',
      lastActivity: 'Negotiated payment terms on a 3-year term.',
      nextStep: 'Generate formal pricing schedule and execute master agreement.',
      summary: 'Late stage deal. Customers are highly aligned on functionality. Just resolving terms scheduling.',
      unresolvedObjectionsCount: 0,
      stakeholderIds: ['stk_innovate_dir', 'stk_innovate_cfo'],
      objectionIds: [],
      taskIds: ['task_innovate_invoice'],
      timelineIds: ['act_innovate_terms'],
      competitiorList: []
    },
    {
      id: 'deal_zenith_audit',
      name: 'Compliance Audit Automated Trail',
      accountId: 'acc_zenith',
      stage: 'Discovery',
      value: 540000,
      closeDate: '2026-12-15',
      healthScore: 72,
      owner: 'Elena Rostova',
      topRisk: 'Complex integration requirements with legacy mainframe audit logs.',
      lastActivity: 'Demonstrated initial integration pilot to technical managers.',
      nextStep: 'Review custom connector pricing matrix with team.',
      summary: 'Extremely high value banking opportunity. Positive discovery. Integrations are main technical risk.',
      unresolvedObjectionsCount: 0,
      stakeholderIds: ['stk_zenith_it', 'stk_zenith_compliance'],
      objectionIds: [],
      taskIds: ['task_zenith_mainframe_spec'],
      timelineIds: ['act_zenith_demo'],
      competitiorList: []
    }
  ],
  stakeholders: [
    {
      id: 'stk_acme_vp',
      name: 'Jonathan Vance',
      role: 'VP of Manufacturing Systems',
      email: 'j.vance@acme.com',
      phone: '+1 (555) 231-9042',
      status: 'Decision Maker',
      sentiment: 'Positive',
      alignmentPercent: 80,
      accountId: 'acc_acme'
    },
    {
      id: 'stk_acme_eng_lead',
      name: 'Dr. Evelyn Carter',
      role: 'Head IoT Signaling Infrastructure',
      email: 'evelyn.carter@acme.com',
      phone: '+1 (555) 231-9043',
      status: 'Champion',
      sentiment: 'Positive',
      alignmentPercent: 95,
      accountId: 'acc_acme'
    },
    {
      id: 'stk_acme_procure',
      name: 'Douglas Stone',
      role: 'Global Procurement Lead',
      email: 'douglas.stone@acme.com',
      phone: '+1 (555) 231-8812',
      status: 'Gatekeeper',
      sentiment: 'Neutral',
      alignmentPercent: 45,
      accountId: 'acc_acme'
    },
    {
      id: 'stk_northstar_cio',
      name: 'Rachel Green',
      role: 'Chief Medical Information Officer',
      email: 'rachelg@northstarhealth.org',
      phone: '+1 (555) 892-1002',
      status: 'Decision Maker',
      sentiment: 'Neutral',
      alignmentPercent: 60,
      accountId: 'acc_northstar'
    },
    {
      id: 'stk_northstar_sec',
      name: 'Vikram Mehta',
      role: 'Lead Information Security Officer',
      email: 'vmehta@northstarhealth.org',
      phone: '+1 (555) 892-1005',
      status: 'Blocker',
      sentiment: 'Negative',
      alignmentPercent: 30,
      accountId: 'acc_northstar'
    },
    {
      id: 'stk_vertex_vp',
      name: 'Arthur Pendelton',
      role: 'VP of Global Operations',
      email: 'apendelton@vertexlogistics.com',
      phone: '+1 (555) 753-4809',
      status: 'Champion',
      sentiment: 'Positive',
      alignmentPercent: 90,
      accountId: 'acc_vertex'
    },
    {
      id: 'stk_vertex_procure',
      name: 'Clara Jenkins',
      role: 'Strategic Sourcing Manager',
      email: 'cjenkins@vertexlogistics.com',
      phone: '+1 (555) 753-4810',
      status: 'Gatekeeper',
      sentiment: 'Unknown',
      alignmentPercent: 50,
      accountId: 'acc_vertex'
    },
    {
      id: 'stk_bluepeak_cto',
      name: 'Yuri Gagarin',
      role: 'CTO & VP Engineering',
      email: 'yuri@bluepeaksystems.com',
      phone: '+1 (555) 472-1092',
      status: 'Decision Maker',
      sentiment: 'Neutral',
      alignmentPercent: 55,
      accountId: 'acc_bluepeak'
    },
    {
      id: 'stk_bluepeak_eng',
      name: 'Alexei Leonov',
      role: 'Site Reliability Engineering Lead',
      email: 'aleonov@bluepeaksystems.com',
      phone: '+1 (555) 472-1093',
      status: 'Champion',
      sentiment: 'Positive',
      alignmentPercent: 85,
      accountId: 'acc_bluepeak'
    },
    {
      id: 'stk_orion_mgr',
      name: 'Meera Patel',
      role: 'Technical Manager Omni-Channel Checkout',
      email: 'meera.patel@orionretail.ai',
      phone: '+1 (555) 918-2041',
      status: 'Influencer',
      sentiment: 'Positive',
      alignmentPercent: 75,
      accountId: 'acc_orion'
    },
    {
      id: 'stk_orion_vp',
      name: 'Gregory House',
      role: 'VP Retail Platform Systems',
      email: 'gregory@orionretail.ai',
      phone: '+1 (555) 918-2001',
      status: 'Decision Maker',
      sentiment: 'Unknown',
      alignmentPercent: 40,
      accountId: 'acc_orion'
    },
    {
      id: 'stk_deltaforge_ops',
      name: 'Colonel Bradley',
      role: 'Operations Director',
      email: 'm.bradley@deltaforge.io',
      phone: '+1 (555) 301-4402',
      status: 'Champion',
      sentiment: 'Positive',
      alignmentPercent: 95,
      accountId: 'acc_deltaforge'
    },
    {
      id: 'stk_deltaforge_gc',
      name: 'Nadia Vance',
      role: 'General Counsel & Risk Lead',
      email: 'nvance@deltaforge.io',
      phone: '+1 (555) 301-4409',
      status: 'Decision Maker',
      sentiment: 'Neutral',
      alignmentPercent: 65,
      accountId: 'acc_deltaforge'
    },
    {
      id: 'stk_innovate_dir',
      name: 'Sophie Germain',
      role: 'Director of Checkout Engineering',
      email: 'sophie@innovatetech.com',
      phone: '+1 (555) 123-9876',
      status: 'Champion',
      sentiment: 'Positive',
      alignmentPercent: 90,
      accountId: 'acc_innovate'
    },
    {
      id: 'stk_innovate_cfo',
      name: 'Alexander Hamilton',
      role: 'CFO & Head of Global Commerce',
      email: 'hamilton@innovatetech.com',
      phone: '+1 (555) 123-1111',
      status: 'Decision Maker',
      sentiment: 'Neutral',
      alignmentPercent: 70,
      accountId: 'acc_innovate'
    },
    {
      id: 'stk_zenith_it',
      name: 'Ada Lovelace',
      role: 'Systems Architecture Lead',
      email: 'ada@zenithfinance.net',
      phone: '+1 (555) 999-8888',
      status: 'Champion',
      sentiment: 'Positive',
      alignmentPercent: 95,
      accountId: 'acc_zenith'
    },
    {
      id: 'stk_zenith_compliance',
      name: 'Winston Churchill',
      role: 'Chief Compliance & Risk Regulator',
      email: 'wchurchill@zenithfinance.net',
      phone: '+1 (555) 999-7777',
      status: 'Decision Maker',
      sentiment: 'Neutral',
      alignmentPercent: 75,
      accountId: 'acc_zenith'
    }
  ],
  activities: [
    {
      id: 'act_acme_price_call',
      dealId: 'deal_acme_iot',
      type: 'call_summary',
      timestamp: '2026-05-20T14:30:00Z',
      title: 'Commercial SLA Alignment',
      description: 'Negotiation meeting on core pricing tiers conducted today morning.',
      badge: 'Call Summary',
      details: 'Meeting with Jonathan Vance & EV of systems. Customer seeks matching 99.99% uptime guarantee with premium support at our basic pricing point. We noted this tier represents a larger system reservation but agreed to review potential alternative package distributions on SLA metrics.'
    },
    {
      id: 'act_acme_ref',
      dealId: 'deal_acme_iot',
      type: 'agent_reflection',
      timestamp: '2026-05-20T16:00:00Z',
      title: 'Hindsight Reflection: Pricing Pushback',
      description: 'AI Agent reflection: Acme Corp has highly complex internal decision hierarchies.',
      badge: 'Reflective Insight',
      details: 'Based on global patterns with similar IoT scale deals, Acme\'s insistence on enterprise support discount hiding a concern about internal integration team capability. Recalled commitment: Sarah promised to deliver modular sample blueprints showing simplicity of integration by Thursday.'
    },
    {
      id: 'act_northstar_sec',
      dealId: 'deal_northstar_portal',
      type: 'objection_logged',
      timestamp: '2026-05-19T10:15:00Z',
      title: 'Security Questionnaire Friction',
      description: 'Lead Security Officer Vikram Mehta flagged security questions as unanswered.',
      badge: 'Objection Logged',
      details: 'Vikram noted our multi-tenant partition scheme does not explicitly state key rotatability schedules for regional backup buckets. Stated this is a flat blocker for Northstar patient data systems.'
    },
    {
      id: 'act_vertex_pilot',
      dealId: 'deal_vertex_fleet',
      type: 'call_summary',
      timestamp: '2026-05-18T16:00:00Z',
      title: 'Operations Trial High Scores Feedback',
      description: 'VP Arthur Pendelton verified 18% fuel cost reductions in trial routes.',
      badge: 'Client Sync',
      details: 'Presented trial metrics overlay. Customer confirmed extreme satisfaction with automatic route corrections. Arthur stated he is drafting procurement paperwork this afternoon, but mentioned procurement typically requires two weeks unless fast-tracked by a sponsor.'
    },
    {
      id: 'act_bluepeak_rival',
      dealId: 'deal_bluepeak_optimize',
      type: 'objection_logged',
      timestamp: '2026-05-17T09:00:00Z',
      title: 'Rival Discount Pressure Warning',
      description: 'Advocate in team warns SentinelFlow submitted an alternative bid at 35% discount.',
      badge: 'Competitor Intel',
      details: 'Competitive bid identified. SentinelFlow is attempting to buyout the entire customer cloud control suite contract by offering matching capabilities with standard support free for the first 12 months.'
    },
    {
      id: 'act_orion_discovery',
      dealId: 'deal_orion_cohort',
      type: 'stage_change',
      timestamp: '2026-05-15T11:00:00Z',
      title: 'Discovery Scope Validated',
      description: 'Completed tech fit audit with Manager Meera Patel.',
      badge: 'Engagement Level',
      details: 'Confirmed fit validation. Main hurdle identified is that Meera reports directly to global store operations, which holds different budget silos than online platforms.'
    },
    {
      id: 'act_deltaforge_legal',
      dealId: 'deal_deltaforge_itar',
      type: 'note_created',
      timestamp: '2026-05-20T08:30:00Z',
      title: 'Legal Hold Assessment',
      description: 'Nadia is vetting the arbitration clauses in Section 14.',
      badge: 'Legal Queue',
      details: 'Nadia requested small adjustments to regional defense definitions. Legal advisor is on it. Health is extremely solid.'
    },
    {
      id: 'act_innovate_terms',
      dealId: 'deal_innovate_tax',
      type: 'call_summary',
      timestamp: '2026-05-16T15:00:00Z',
      title: 'Commercial Term Review',
      description: 'Agreed on 3-year commercial distribution structure with CFO Hamilton.',
      badge: 'Sponsor Call',
      details: 'Both sides agreed to a sliding scale commission mapping. Master agreements will be compiled by finance staff.'
    },
    {
      id: 'act_zenith_demo',
      dealId: 'deal_zenith_audit',
      type: 'note_created',
      timestamp: '2026-05-14T10:00:00Z',
      title: 'Mainframe Pilot Successful Run',
      description: 'Delivered customized parser schema connecting to Zenith sandbox environment.',
      badge: 'Architecture Validation',
      details: 'Engineers verified throughput levels at 120,000 log elements per minute with negligible virtualization overhead.'
    }
  ],
  objections: [
    {
      id: 'obj_acme_pricing',
      dealId: 'deal_acme_iot',
      stakeholderId: 'stk_acme_procure',
      text: 'Procurement insists our enterprise package list price is 15% too high compared to legacy IndustrialSystems Inc annual maintenance costs.',
      type: 'pricing',
      status: 'unresolved',
      recordedDate: '2026-05-20'
    },
    {
      id: 'obj_northstar_security',
      dealId: 'deal_northstar_portal',
      stakeholderId: 'stk_northstar_sec',
      text: 'Uptime backup vault redundancy metrics and encryption key rotation schedules do not meet custom regional hospital compliance standards.',
      type: 'security',
      status: 'unresolved',
      recordedDate: '2026-05-19'
    },
    {
      id: 'obj_bluepeak_competitor',
      dealId: 'deal_bluepeak_optimize',
      stakeholderId: 'stk_bluepeak_cto',
      text: 'SentinelOps has offered standard cloud optimization layers for free, with deep platform integration hooks.',
      type: 'competitor',
      status: 'unresolved',
      recordedDate: '2026-05-17'
    },
    {
      id: 'obj_deltaforge_itar',
      dealId: 'deal_deltaforge_itar',
      stakeholderId: 'stk_deltaforge_gc',
      text: 'Arbitration jurisdiction listed in the boilerplate must remain within strict defense-industrial court boundaries.',
      type: 'legal',
      status: 'resolved',
      resolution: 'Accepted transition of arbitration scope to default federal venue as of 2026-05-20.',
      recordedDate: '2026-05-15'
    }
  ],
  tasks: [
    {
      id: 'task_acme_sla',
      dealId: 'deal_acme_iot',
      description: 'Prepare custom tiered SLA package layout for Acme Corp outlining 99.99% critical systems support options and associated pricing metrics.',
      dueDate: '2026-05-23',
      priority: 'high',
      status: 'pending',
      owner: 'Sarah Connor',
      suggestedMessage: 'Hi Jonathan - Following up on our SLA conversation. I’ve structured a custom option for Acme that provides 99.99% critical response guarantees by pairing our standard core routing engines...'
    },
    {
      id: 'task_northstar_meeting',
      dealId: 'deal_northstar_portal',
      description: 'Schedule aligning meeting between our security lead and Vikram Mehta to address EHR encryption keys and SOC2 compliance concerns directly.',
      dueDate: '2026-05-24',
      priority: 'high',
      status: 'pending',
      owner: 'Marcus Aurelius',
      suggestedMessage: 'Dear Vikram - I understand your rigorous security requirements for Northstar Patient systems. I would like to host a quick alignment session with our Chief Information Security Officer to answer your questions...'
    },
    {
      id: 'task_vertex_intro',
      dealId: 'deal_vertex_fleet',
      description: 'Secure formal warm introduction link from Arthur Pendelton to the corporate logistics procurement officer Clara Jenkins.',
      dueDate: '2026-05-22',
      priority: 'medium',
      status: 'pending',
      owner: 'Elena Rostova',
      suggestedMessage: 'Arthur - Truly appreciate the positive feedback on the fuel savings trial results! To help move this to production, could you connect me with Clara Jenkins on procurement to align on standard onboarding?'
    },
    {
      id: 'task_bluepeak_roi',
      dealId: 'deal_bluepeak_optimize',
      description: 'Deliver detailed Multi-cloud optimization ROI report showing 40% increased savings compared to SentinelOps over a 24-month horizon.',
      dueDate: '2026-05-25',
      priority: 'high',
      status: 'pending',
      owner: 'Sarah Connor',
      suggestedMessage: 'Hi Alexei - I wanted to highlight that while other options present standard cost metrics, our dedicated cold-container analytics layer achieves 42% deeper savings. Here is our comparative validation sheet...'
    },
    {
      id: 'task_orion_find_vp',
      dealId: 'deal_orion_cohort',
      description: 'Map senior directory for Orion platform systems division and reach out to the platform VP regarding pilot programs.',
      dueDate: '2026-05-29',
      priority: 'low',
      status: 'pending',
      owner: 'Marcus Aurelius'
    },
    {
      id: 'task_deltaforge_gc_sync',
      dealId: 'deal_deltaforge_itar',
      description: 'Initiate quick call with general counsel Nadia Vance to confirm ITAR audit wording adjustments in master contract.',
      dueDate: '2026-05-22',
      priority: 'medium',
      status: 'completed',
      owner: 'Elena Rostova',
      suggestedMessage: 'Hi Nadia - Just wanted to confirm our legal lead accepted the venue adjustment. I look forward to signing off the contract document.'
    },
    {
      id: 'task_innovate_invoice',
      dealId: 'deal_innovate_tax',
      description: 'Review custom multi-year commercial contract payment structure schedule with corporate accounting.',
      dueDate: '2026-05-25',
      priority: 'medium',
      status: 'pending',
      owner: 'Sarah Connor'
    },
    {
      id: 'task_zenith_mainframe_spec',
      dealId: 'deal_zenith_audit',
      description: 'Draft technical security specification matrix for mainframe audit connector ingestion process.',
      dueDate: '2026-06-01',
      priority: 'high',
      status: 'pending',
      owner: 'Elena Rostova'
    }
  ],
  memories: [
    {
      id: 'mem_acme_commit',
      dealId: 'deal_acme_iot',
      timestamp: '2026-05-20T14:45:00Z',
      summary: 'Commitment made: Sarah Connor promised to deliver a modular tiered support package pricing and SLA comparison overlay to Jonathan Vance by Thursday.',
      type: 'commitment',
      score: 9
    },
    {
      id: 'mem_northstar_auditor',
      dealId: 'deal_northstar_portal',
      timestamp: '2026-05-19T10:30:00Z',
      summary: 'Stakeholder discovery: Northstar Auditor Vikram Mehta flagged HIPAA partition concerns regarding offsite database backups and is a potential deal blocker.',
      type: 'stakeholder',
      score: 10
    },
    {
      id: 'mem_bluepeak_discount',
      dealId: 'deal_bluepeak_optimize',
      timestamp: '2026-05-17T09:15:00Z',
      summary: 'Competitor movement: SentinelOps offering free standard support for the first year with aggressive platform discount pricing of 35% on multi-year renewal.',
      type: 'competitor',
      score: 8
    },
    {
      id: 'mem_vertex_trial_ok',
      dealId: 'deal_vertex_fleet',
      timestamp: '2026-05-18T16:20:00Z',
      summary: 'Operations milestone: Dynamics trial successfully achieved 18% fuel logistics optimization. Champion Arthur Pendelton declared high willingness to sponsor.',
      type: 'milestone',
      score: 9
    },
    {
      id: 'mem_deltaforge_jurisdict',
      dealId: 'deal_deltaforge_itar',
      timestamp: '2026-05-15T11:45:00Z',
      summary: 'Objection resolved: Transitioned arbitration jurisdiction disputes to federal court venue. General counsel Nadia Vance expressed satisfaction.',
      type: 'objection',
      score: 7
    }
  ],
  reflections: [
    {
      id: 'ref_1',
      timestamp: '2026-05-20T17:00:00Z',
      insight: 'Enterprise sales cycles in traditional heavy machinery sectors (like Acme Corp) frequently encounter SLA friction. This friction is often proxy resistance masks internal systems implementation fear rather than product feature capability.',
      category: 'relationship',
      severity: 'medium'
    },
    {
      id: 'ref_2',
      timestamp: '2026-05-19T11:00:00Z',
      insight: 'Healthcare system sales are strongly dependent on IT Security and Compliance buy-in. Engaging functional champions without standard auditing security paperwork early is a key source of deal stagnation.',
      category: 'process',
      severity: 'high'
    },
    {
      id: 'ref_3',
      timestamp: '2026-05-17T09:30:00Z',
      insight: 'Incumbent competitors like SentinelOps are deploying aggressive pricing tactics under commercial threat. Combating them through price-undercutting is ineffective; campaigns should double down on cost-recovery metrics and cold-state platform control dashboards.',
      category: 'pricing',
      severity: 'high'
    }
  ],
  savedDrafts: [
    {
      id: 'drf_1',
      dealId: 'deal_acme_iot',
      recipientName: 'Jonathan Vance',
      recipientEmail: 'j.vance@acme.com',
      subject: 'Custom SLA Pricing Options - Proffer AI',
      text: 'Hi Jonathan - Following up on our productive sync. Here is the custom Tier outline built specifically for Acme...\n\n- Option A: Standard 99.9% Uptime with next-business-day response.\n- Option B: Enterprise Plus 99.99% Premium Uptime with dedicated 30-minute response on critical priority incidents...',
      type: 'follow_up',
      createdAt: '2026-05-20'
    }
  ]
};
