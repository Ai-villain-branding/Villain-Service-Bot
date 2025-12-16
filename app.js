require('dotenv').config();
const { App } = require('@slack/bolt');
const fetch = require('node-fetch'); // For Node <18, else remove if using Node 18+

/** -----------------------------
 * Services (unchanged)
 * ----------------------------- */
const SERVICES = ['Messaging', 'Advertisement', 'Naming', 'Strategy'];
const SERVICE_OPTIONS = SERVICES.map(s => ({
  text: { type: 'plain_text', text: s },
  value: s,
}));

/** -----------------------------
 * Questions registry
 * (Messaging questions exist here; we choose which to show later)
 * ----------------------------- */
const COMMON_QUESTIONS = [
  // Shared (used by Messaging too, filtered by complexity)
  {
    id: 'client_materials',
    appliesTo: ['Messaging', 'Naming', 'Strategy'],
    label: 'How many client materials to review?',
    type: 'static_select',
    options: ['three (3)', 'five (5)', 'ten (10)', 'fifteen (15)'],
  },
  {
    id: 'competitors_analyze',
    appliesTo: ['Messaging', 'Naming', 'Strategy'],
    label: 'How many competitors to analyze?',
    type: 'static_select',
    options: ['two (2)', 'three (3)', 'five (5)', 'eight (8)'],
  },

  /** Messaging-only */
  {
    id: 'messaging_strategy_session',
    appliesTo: ['Messaging'],
    label: 'How long of a strategy work session is required?',
    type: 'static_select',
    options: ['60 minutes', '1.5 hours', '4 hours'],
  },
  {
    id: 'messaging_primary_target_audiences',
    appliesTo: ['Messaging'],
    label: 'How many primary target audiences should be prioritised?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_sharp_messaging_themes',
    appliesTo: ['Messaging'],
    label: 'How many sharp messaging themes to anchor all launch communications?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_headline_options',
    appliesTo: ['Messaging'],
    label: 'How many headline options?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_topline_demos_of_existing_products',
    appliesTo: ['Messaging'],
    label: 'How many topline demos of existing products and product roadmaps to attend?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_facilitate_the_work',
    appliesTo: ['Messaging'],
    label: 'How to facilitate the work session?',
    type: 'static_select',
    options: ['in-person', 'virtual'],
  },
  {
    id: 'messaging_top-level_messages',
    appliesTo: ['Messaging'],
    label: 'How many top-level messages are aligned with the strategic vision?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_rounds_of_refinement',
    appliesTo: ['Messaging'],
    label: 'How many rounds of refinement?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_dedicated_rounds_of_internal_feedback',
    appliesTo: ['Messaging'],
    label: 'How many dedicated rounds of internal feedback and revisions to final deliverables?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_hour_worksession_with_internal_teams',
    appliesTo: ['Messaging'],
    label: 'How many hour worksession with internal teams and leadership?',
    type: 'static_select',
    options: ['1-hour', '90-minutes', '2-hours', '4-hours'],
  },
  {
    id: 'messaging_core_messages_aligned',
    appliesTo: ['Messaging'],
    label: 'How many core messages aligned to the Client’s strategic vision?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'eight (8)'],
  },
  {
    id: 'messaging_interviews_with_internal_stakeholders',
    appliesTo: ['Messaging'],
    label: 'How many interviews with internal stakeholders?',
    type: 'static_select',
    options: ['zero (0)', 'three (3)', 'five (5)', 'seven (7)'],
  },
  {
    id: 'messaging_best_practices_communication',
    appliesTo: ['Messaging'],
    label: 'How many best practices communication assets?',
    type: 'static_select',
    options: ['zero (0)', 'three (3)', 'five (5)', 'eight (8)'],
  },
  {
    id: 'messaging_payment_timeline_from_the_invoice',
    appliesTo: ['Messaging'],
    label: 'What is the payment timeline from the invoice date for work delivered to the client?',
    type: 'static_select',
    options: ['30 days', '45 days', '60 days', '90 days'],
  },
  {
    id: 'messaging_product_information_session',
    appliesTo: ['Messaging'],
    label: 'How many product information session led by the client?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_demos_for_existing_products',
    appliesTo: ['Messaging'],
    label: 'How many demos for existing products to be attended?',
    type: 'static_select',
    options: ['zero (0)', 'two (2)', 'four (4)', 'six (6)'],
  },
  {
    id: 'messaging_tailored_version_of_the_message_framework',
    appliesTo: ['Messaging'],
    label: 'How many tailored version of the message framework to include messaging?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_high_impact_touchpoints',
    appliesTo: ['Messaging'],
    label: 'How many high-impact touchpoints?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_How_many_product_messages',
    appliesTo: ['Messaging'],
    label: 'How many product messages?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_Recommendations_on_how_product',
    appliesTo: ['Messaging'],
    label: 'How many recommendations on how product messaging integrates?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_60-minute_virtual_workshop',
    appliesTo: ['Messaging'],
    label: 'How many 60-minute virtual workshop?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_do’s_and_don’ts_suggestions',
    appliesTo: ['Messaging'],
    label: 'How many tactical do’s and don’ts suggestions?',
    type: 'static_select',
    options: ['zero (0)', 'four (4)', 'eight (8)', 'twelve (12)'],
  },
  {
    id: 'messaging_clear_behavioral_commitments',
    appliesTo: ['Messaging'],
    label: 'How many clear behavioral commitments?',
    type: 'static_select',
    options: ['30 days', '45 days', '60 days'],
  },
  {
    id: 'messaging_NET_payments',
    appliesTo: ['Messaging'],
    label: 'What are the NET terms?',
    type: 'static_select',
    options: ['zero (0)', 'three (3)', 'five (5)', 'eight (8)'],
  },
  {
  id: 'messaging_expiration_date',
  appliesTo: ['Messaging'],
  label: 'Expiration Date',
  type: 'datepicker',
  },

  /** Advertisement-only (no overlaps) */
  {
    id: 'advertisement_platforms',
    appliesTo: ['Advertisement'],
    label: 'Advertisement: Platforms',
    type: 'multi_static_select',
    options: ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Other'],
  },
  {
    id: 'advertisement_budget',
    appliesTo: ['Advertisement'],
    label: 'Advertisement: What is your budget?',
    type: 'plain_text_input',
    placeholder: 'e.g. $5000/month',
  },
  {
    id: 'advertisement_duration',
    appliesTo: ['Advertisement'],
    label: 'Advertisement: Campaign Duration (weeks)',
    type: 'static_select',
    options: ['2 weeks', '4 weeks', '8 weeks'],
  },

  /** Naming-only (non-complexity) */
  {
    id: 'naming_creative_territories',
    appliesTo: ['Naming'],
    label: 'Naming: How many unique creative naming territories?',
    type: 'static_select',
    options: ['Two (2)', 'four (4)', 'Six (6)'],
  },
  {
    id: 'naming_options',
    appliesTo: ['Naming'],
    label: 'Naming: How many naming options?',
    type: 'static_select',
    options: [
      'One Hundred (100)',
      'Two Hundred (200)',
      'three Hundred (300)',
      'four Hundred (400)',
    ],
  },
  {
    id: 'naming_prescreened_candidates',
    appliesTo: ['Naming'],
    label: 'Naming: How many pre-screened name candidates?',
    type: 'static_select',
    options: ['Ten (10)', 'Twenty (20)', 'Thirty (30)'],
  },
  {
    id: 'naming_legal_vetted',
    appliesTo: ['Naming'],
    label: 'Naming: How many shortlist name candidates are legally vetted?',
    type: 'static_select',
    options: ['three (3)', 'Six (6)', 'eight (8)', 'Ten (10)'],
  },
  {
    id: 'naming_shortlist_legal_vetting',
    appliesTo: ['Naming'],
    label: 'Naming: How many shortlist name candidates for legal vetting?',
    type: 'static_select',
    options: ['Thirty (30)', 'Fifty (50)', 'Seventy (70)', 'One Hundred (100)'],
  },
];

/** -----------------------------
 * Messaging Complexity → Question IDs
 * ----------------------------- */
const MESSAGING_COMPLEXITY_QUESTIONS = {
  Light: [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_primary_target_audiences','messaging_sharp_messaging_themes','messaging_headline_options','messaging_expiration_date',
  ],
  Medium: [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_topline_demos_of_existing_products','messaging_facilitate_the_work',
    'messaging_top-level_messages','messaging_rounds_of_refinement','messaging_dedicated_rounds_of_internal_feedback',
    'messaging_hour_worksession_with_internal_teams','messaging_core_messages_aligned','messaging_clear_behavioral_commitments','messaging_expiration_date',
  ],
  Large: [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_topline_demos_of_existing_products','messaging_interviews_with_internal_stakeholders',
    'messaging_facilitate_the_work','messaging_top-level_messages','messaging_best_practices_communication',
    'messaging_rounds_of_refinement','messaging_hour_worksession_with_internal_teams','messaging_core_messages_aligned',
    'messaging_dedicated_rounds_of_internal_feedback','messaging_payment_timeline_from_the_invoice','messaging_clear_behavioral_commitments','messaging_expiration_date',
  ],
  'Extra Large': [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_demos_for_existing_products','messaging_interviews_with_internal_stakeholders','messaging_facilitate_the_work',
    'messaging_hour_worksession_with_internal_teams','messaging_top-level_messages','messaging_best_practices_communication',
    'messaging_rounds_of_refinement','messaging_core_messages_aligned','messaging_dedicated_rounds_of_internal_feedback',
    'messaging_product_information_session','messaging_tailored_version_of_the_message_framework','messaging_high_impact_touchpoints',
    'messaging_How_many_product_messages','messaging_Recommendations_on_how_product','messaging_60-minute_virtual_workshop',
    'messaging_do’s_and_don’ts_suggestions','messaging_clear_behavioral_commitments','messaging_payment_timeline_from_the_invoice','messaging_clear_behavioral_commitments','messaging_expiration_date',
  ],
};
/** -----------------------------
 * Helpers
 * ----------------------------- */
function buildBlockFromQuestion(q) {
  const block_id = `${q.id}_block`;

  let element;
  if (q.type === 'static_select') {
    element = {
      type: 'static_select',
      action_id: q.id,
      options: q.options.map(o => ({
        text: { type: 'plain_text', text: o },
        value: o,
      })),
      placeholder: { type: 'plain_text', text: 'Select…' },
    };
  } else if (q.type === 'multi_static_select') {
    element = {
      type: 'multi_static_select',
      action_id: q.id,
      options: q.options.map(o => ({
        text: { type: 'plain_text', text: o },
        value: o,
      })),
      placeholder: { type: 'plain_text', text: 'Select one or more…' },
    };
  } else if (q.type === 'plain_text_input') {
    element = {
      type: 'plain_text_input',
      action_id: q.id,
      placeholder: q.placeholder
        ? { type: 'plain_text', text: q.placeholder }
        : undefined,
    };
  } else if (q.type === 'datepicker') {
    element = {
      type: 'datepicker',
      action_id: q.id,
      placeholder: { type: 'plain_text', text: 'Select a date' },
    };
  } else {
    throw new Error(`Unsupported question type: ${q.type}`);
  }

  return {
    type: 'input',
    block_id,
    label: { type: 'plain_text', text: q.label },
    element,
  };
}


function buildComplexityBlock(service) {
  return {
    type: 'input',
    block_id: `${service.toLowerCase()}_complexity_level_block`,
    label: { type: 'plain_text', text: `${service}: Complexity Level` },
    dispatch_action: true, // <-- IMPORTANT: fire action on selection change
    element: {
      type: 'static_select',
      action_id: 'complexity_level',
      placeholder: { type: 'plain_text', text: 'Select complexity' },
      options: [
        { text: { type: 'plain_text', text: 'Light' }, value: 'Light' },
        { text: { type: 'plain_text', text: 'Medium' }, value: 'Medium' },
        { text: { type: 'plain_text', text: 'Large' }, value: 'Large' },
        { text: { type: 'plain_text', text: 'Extra Large' }, value: 'Extra Large' },
      ],
    },
  };
}

/**
 * Build blocks for the details view.
 * Returns { blocks, showSubmit }
 * - If Messaging is selected but complexity not chosen yet => no questions + hide Submit.
 * - Once complexity chosen => add allowed Messaging questions + show Submit.
 * - Other services (non-Messaging) questions can be shown immediately.
 */
function buildServiceDetailsBlocks(meta, stateValues) {
  const { companyName, projectName, date, selectedServices } = meta;
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Company:* ${companyName}\n*Project:* ${projectName}\n*Date:* ${date}\n*Services:* ${selectedServices.join(', ')}`,
      },
    },
  ];

  // Add complexity pickers
  selectedServices.forEach(svc => {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'header', text: { type: 'plain_text', text: `${svc} · Complexity` } });
    blocks.push(buildComplexityBlock(svc));
  });

  let messagingNeedsComplexity = false;
  let showSubmit = true;

  // Determine allowed question IDs
  const allowedIds = new Set();

  selectedServices.forEach(svc => {
    if (svc === 'Messaging') {
      const blockId = `${svc.toLowerCase()}_complexity_level_block`;
      const selectedComplexity =
        stateValues?.[blockId]?.complexity_level?.selected_option?.value || null;

      if (!selectedComplexity) {
        // complexity not chosen yet ⇒ don't show Messaging questions, and hide Submit
        messagingNeedsComplexity = true;
        showSubmit = false;
      } else {
        (MESSAGING_COMPLEXITY_QUESTIONS[selectedComplexity] || []).forEach(id => allowedIds.add(id));
      }
    } else {
      // Non-Messaging: include all applicable questions right away
      COMMON_QUESTIONS
        .filter(q => q.appliesTo.includes(svc))
        .forEach(q => allowedIds.add(q.id));
    }
  });

  if (allowedIds.size > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'header', text: { type: 'plain_text', text: 'Questions' } });
    COMMON_QUESTIONS
      .filter(q => allowedIds.has(q.id))
      .forEach(q => blocks.push(buildBlockFromQuestion(q)));
  } else if (messagingNeedsComplexity) {
    // Helpful hint block
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_Select a **Messaging** complexity to proceed._' },
    });
  }

  return { blocks, showSubmit };
}

/** -----------------------------
 * Slack app
 * ----------------------------- */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.command('/service', async ({ ack, body, client }) => {
  await ack();
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'service_intro_modal',
      title: { type: 'plain_text', text: 'Project Kickoff' },
      submit: { type: 'plain_text', text: 'Next' },
      close: { type: 'plain_text', text: 'Cancel' },
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'Submitting Details' } },
        {
          type: 'input',
          block_id: 'company_name_block',
          label: { type: 'plain_text', text: 'Company Name' },
          element: { type: 'plain_text_input', action_id: 'company_name' },
        },
        {
          type: 'input',
          block_id: 'project_name_block',
          label: { type: 'plain_text', text: 'Project Name' },
          element: { type: 'plain_text_input', action_id: 'project_name' },
        },
        {
          type: 'input',
          block_id: 'date_block',
          label: { type: 'plain_text', text: 'Date' },
          element: { type: 'datepicker', action_id: 'date' },
        },
        {
          type: 'input',
          block_id: 'services_block',
          label: { type: 'plain_text', text: 'Services We Offer' },
          element: { type: 'multi_static_select', action_id: 'services', options: SERVICE_OPTIONS },
        },
      ],
    },
  });
});

app.view('service_intro_modal', async ({ ack, view }) => {
  const values = view.state.values;
  const companyName = values.company_name_block.company_name.value;
  const projectName = values.project_name_block.project_name.value;
  const date = values.date_block.date.selected_date;
  const selectedServices = values.services_block.services.selected_options.map(o => o.value);

  if (!companyName || !projectName || !date || selectedServices.length === 0) {
    await ack({
      response_action: 'errors',
      errors: {
        company_name_block: !companyName ? 'Company name is required' : undefined,
        project_name_block: !projectName ? 'Project name is required' : undefined,
        date_block: !date ? 'Please select a date' : undefined,
        services_block: selectedServices.length === 0 ? 'Select at least one service' : undefined,
      },
    });
    return;
  }

  const meta = { companyName, projectName, date, selectedServices };
  const { blocks, showSubmit } = buildServiceDetailsBlocks(meta, /* stateValues */ undefined);

  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: 'service_details_modal',
      title: { type: 'plain_text', text: 'Service Details' },
      // Hide submit until questions are visible
      ...(showSubmit ? { submit: { type: 'plain_text', text: 'Submit' } } : {}),
      close: { type: 'plain_text', text: 'Cancel' },
      private_metadata: JSON.stringify(meta),
      blocks,
    },
  });
});

/**
 * React to complexity selection and update the modal in-place
 */
app.action('complexity_level', async ({ ack, body, client }) => {
  await ack();

  const meta = JSON.parse(body.view.private_metadata || '{}');
  const stateValues = body.view.state.values;
  const { blocks, showSubmit } = buildServiceDetailsBlocks(meta, stateValues);

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash, // avoid race conditions
    view: {
      type: 'modal',
      callback_id: 'service_details_modal',
      title: { type: 'plain_text', text: 'Service Details' },
      ...(showSubmit ? { submit: { type: 'plain_text', text: 'Submit' } } : {}),
      close: { type: 'plain_text', text: 'Cancel' },
      private_metadata: body.view.private_metadata,
      blocks,
    },
  });
});

app.view('service_details_modal', async ({ ack, view, body }) => {
  await ack();

  const { companyName, projectName, date, selectedServices } = JSON.parse(view.private_metadata || '{}');
  const values = view.state.values;

  const result = {
    user: body.user.id,
    company_name: companyName,
    project_name: projectName,
    date,
    selected_services: selectedServices,
    service_details: {},
  };

  // Read per-service complexity first
  const complexityMap = {};
  selectedServices.forEach(service => {
    const blockId = `${service.toLowerCase()}_complexity_level_block`;
    const complexity = values[blockId]?.complexity_level?.selected_option?.value || null;
    result.service_details[service] = { complexity_level: complexity };
    complexityMap[service] = complexity;
  });

  // Read only the blocks present (what the user actually saw)
  COMMON_QUESTIONS.forEach(q => {
    const blockId = `${q.id}_block`;
    if (!values[blockId]) return;

    const el = values[blockId][q.id];
    let answer = null;

    if (q.type === 'static_select') {
      answer = el?.selected_option?.value || null;
    } else if (q.type === 'multi_static_select') {
      answer = (el?.selected_options || []).map(o => o.value);
    } else if (q.type === 'plain_text_input') {
      answer = el?.value || null;
    }
    else if (q.type === 'datepicker') {
  answer = el?.selected_date || null;
    }

    selectedServices.forEach(svc => {
      if (svc === 'Messaging') {
        const allowed = MESSAGING_COMPLEXITY_QUESTIONS[complexityMap[svc]] || [];
        if (!allowed.includes(q.id)) return;
      }
      if (!q.appliesTo.includes(svc)) return;
      if (!result.service_details[svc]) result.service_details[svc] = {};
      result.service_details[svc][q.id] = answer;
    });
  });

  try {
    const r = await fetch('https://villain-branding.app.n8n.cloud/webhook/b9223a9e-8b4a-4235-8b5f-144fcf3f27a4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    console.log('Webhook:', await r.text());
  } catch (e) {
    console.error('Webhook error:', e);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app is running!');
})();
