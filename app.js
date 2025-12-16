require('dotenv').config();
const { App } = require('@slack/bolt');
const fetch = require('node-fetch');

/** -----------------------------
 * Services
 * ----------------------------- */
const SERVICES = ['Messaging', 'Advertisement', 'Naming', 'Strategy'];
const SERVICE_OPTIONS = SERVICES.map(s => ({
  text: { type: 'plain_text', text: s },
  value: s,
}));

/** -----------------------------
 * Questions registry
 * ----------------------------- */
const COMMON_QUESTIONS = [
  {
    id: 'client_materials',
    appliesTo: ['Messaging', 'Naming', 'Strategy'],
    label: 'How many client materials to review?',
    type: 'static_select',
    options: ['Three (3)', 'Five (5)', 'Ten (10)', 'Fifteen (15)'],
  },
  {
    id: 'competitors_analyze',
    appliesTo: ['Messaging', 'Naming', 'Strategy'],
    label: 'How many competitors to analyze?',
    type: 'static_select',
    options: ['Two (2)', 'Three (3)', 'Five (5)', 'Eight (8)'],
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
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_sharp_messaging_themes',
    appliesTo: ['Messaging'],
    label: 'How many sharp messaging themes?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_headline_options',
    appliesTo: ['Messaging'],
    label: 'How many headline options?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_facilitate_the_work',
    appliesTo: ['Messaging'],
    label: 'How to facilitate the work session?',
    type: 'static_select',
    options: ['In-person', 'Virtual'],
  },

  /** ✅ FIXED DATE QUESTION */
  {
    id: 'messaging_expiration_date',
    appliesTo: ['Messaging'],
    label: 'Expiration date',
    type: 'datepicker',
  },

  /** Advertisement */
  {
    id: 'advertisement_platforms',
    appliesTo: ['Advertisement'],
    label: 'Advertisement platforms',
    type: 'multi_static_select',
    options: ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Other'],
  },
  {
    id: 'advertisement_budget',
    appliesTo: ['Advertisement'],
    label: 'Advertisement budget',
    type: 'plain_text_input',
    placeholder: 'e.g. $5,000 / month',
  },

  /** Naming */
  {
    id: 'naming_options',
    appliesTo: ['Naming'],
    label: 'How many naming options?',
    type: 'static_select',
    options: ['100', '200', '300', '400'],
  },
];

/** -----------------------------
 * Messaging Complexity Mapping
 * ----------------------------- */
const MESSAGING_COMPLEXITY_QUESTIONS = {
  Light: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_primary_target_audiences',
    'messaging_expiration_date',
  ],
  Medium: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_facilitate_the_work',
    'messaging_expiration_date',
  ],
  Large: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_facilitate_the_work',
    'messaging_expiration_date',
  ],
  'Extra Large': [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_facilitate_the_work',
    'messaging_expiration_date',
  ],
};

/** -----------------------------
 * Helpers
 * ----------------------------- */
function buildBlockFromQuestion(q) {
  if (!q.type) {
    throw new Error(`Question "${q.id}" is missing type`);
  }

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
      placeholder: { type: 'plain_text', text: 'Select…' },
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
    block_id: `${q.id}_block`,
    label: { type: 'plain_text', text: q.label },
    element,
  };
}

function buildComplexityBlock(service) {
  return {
    type: 'input',
    block_id: `${service.toLowerCase()}_complexity_level_block`,
    dispatch_action: true,
    label: { type: 'plain_text', text: `${service} Complexity` },
    element: {
      type: 'static_select',
      action_id: 'complexity_level',
      placeholder: { type: 'plain_text', text: 'Select complexity' },
      options: ['Light', 'Medium', 'Large', 'Extra Large'].map(v => ({
        text: { type: 'plain_text', text: v },
        value: v,
      })),
    },
  };
}

function buildServiceDetailsBlocks(meta, stateValues) {
  const blocks = [];
  let showSubmit = true;
  const allowedIds = new Set();

  meta.selectedServices.forEach(service => {
    blocks.push({ type: 'divider' });
    blocks.push(buildComplexityBlock(service));

    if (service === 'Messaging') {
      const blockId = `${service.toLowerCase()}_complexity_level_block`;
      const complexity =
        stateValues?.[blockId]?.complexity_level?.selected_option?.value;

      if (!complexity) {
        showSubmit = false;
        return;
      }

      MESSAGING_COMPLEXITY_QUESTIONS[complexity].forEach(id =>
        allowedIds.add(id)
      );
    } else {
      COMMON_QUESTIONS.filter(q => q.appliesTo.includes(service)).forEach(q =>
        allowedIds.add(q.id)
      );
    }
  });

  COMMON_QUESTIONS.filter(q => allowedIds.has(q.id)).forEach(q =>
    blocks.push(buildBlockFromQuestion(q))
  );

  return { blocks, showSubmit };
}

/** -----------------------------
 * Slack App
 * ----------------------------- */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

/** -----------------------------
 * Command
 * ----------------------------- */
app.command('/service', async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'intro',
      title: { type: 'plain_text', text: 'Project Kickoff' },
      submit: { type: 'plain_text', text: 'Next' },
      blocks: [
        {
          type: 'input',
          block_id: 'services_block',
          label: { type: 'plain_text', text: 'Services' },
          element: {
            type: 'multi_static_select',
            action_id: 'services',
            options: SERVICE_OPTIONS,
          },
        },
      ],
    },
  });
});

/** -----------------------------
 * Modal submit
 * ----------------------------- */
app.view('intro', async ({ ack, view }) => {
  await ack();

  const selectedServices =
    view.state.values.services_block.services.selected_options.map(o => o.value);

  const meta = { selectedServices };
  const { blocks, showSubmit } = buildServiceDetailsBlocks(meta, null);

  return {
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: 'details',
      title: { type: 'plain_text', text: 'Service Details' },
      ...(showSubmit && { submit: { type: 'plain_text', text: 'Submit' } }),
      private_metadata: JSON.stringify(meta),
      blocks,
    },
  };
});

/** -----------------------------
 * Complexity change
 * ----------------------------- */
app.action('complexity_level', async ({ ack, body, client }) => {
  await ack();

  const meta = JSON.parse(body.view.private_metadata);
  const { blocks, showSubmit } = buildServiceDetailsBlocks(
    meta,
    body.view.state.values
  );

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: {
      type: 'modal',
      callback_id: 'details',
      title: { type: 'plain_text', text: 'Service Details' },
      ...(showSubmit && { submit: { type: 'plain_text', text: 'Submit' } }),
      private_metadata: body.view.private_metadata,
      blocks,
    },
  });
});

/** -----------------------------
 * Start app
 * ----------------------------- */
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡ Slack Bolt app running');
})();
