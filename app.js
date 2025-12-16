require('dotenv').config();
const { App } = require('@slack/bolt');
const fetch = require('node-fetch');

/** -----------------------------
 * Services
 * ----------------------------- */
const SERVICES = ['messaging', 'advertisement', 'naming', 'strategy'];
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
    appliesTo: ['messaging', 'naming', 'strategy'],
    label: 'how many client materials to review?',
    type: 'static_select',
    options: ['three (3)', 'five (5)', 'ten (10)', 'fifteen (15)'],
  },
  {
    id: 'competitors_analyze',
    appliesTo: ['messaging', 'naming', 'strategy'],
    label: 'how many competitors to analyze?',
    type: 'static_select',
    options: ['two (2)', 'three (3)', 'five (5)', 'eight (8)'],
  },

  /** messaging-only */
  {
    id: 'messaging_strategy_session',
    appliesTo: ['messaging'],
    label: 'how long of a strategy work session is required?',
    type: 'static_select',
    options: ['60 minutes', '1.5 hours', '4 hours'],
  },
  {
    id: 'messaging_primary_target_audiences',
    appliesTo: ['messaging'],
    label: 'how many primary target audiences should be prioritised?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_sharp_messaging_themes',
    appliesTo: ['messaging'],
    label: 'how many sharp messaging themes?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_headline_options',
    appliesTo: ['messaging'],
    label: 'how many headline options?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_topline_demos_of_existing_products',
    appliesTo: ['messaging'],
    label: 'how many topline demos to attend?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_facilitate_the_work',
    appliesTo: ['messaging'],
    label: 'how to facilitate the work session?',
    type: 'static_select',
    options: ['in-person', 'virtual'],
  },
  {
    id: 'messaging_top-level_messages',
    appliesTo: ['messaging'],
    label: 'how many top-level messages?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_rounds_of_refinement',
    appliesTo: ['messaging'],
    label: 'how many rounds of refinement?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_dedicated_rounds_of_internal_feedback',
    appliesTo: ['messaging'],
    label: 'how many internal feedback rounds?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'three (3)'],
  },
  {
    id: 'messaging_hour_worksession_with_internal_teams',
    appliesTo: ['messaging'],
    label: 'how long is the internal worksession?',
    type: 'static_select',
    options: ['1-hour', '90-minutes', '2-hours', '4-hours'],
  },
  {
    id: 'messaging_core_messages_aligned',
    appliesTo: ['messaging'],
    label: 'how many core messages aligned to vision?',
    type: 'static_select',
    options: ['zero (0)', 'one (1)', 'two (2)', 'eight (8)'],
  },
  {
    id: 'messaging_interviews_with_internal_stakeholders',
    appliesTo: ['messaging'],
    label: 'how many internal stakeholder interviews?',
    type: 'static_select',
    options: ['zero (0)', 'three (3)', 'five (5)', 'seven (7)'],
  },
  {
    id: 'messaging_best_practices_communication',
    appliesTo: ['messaging'],
    label: 'how many best practice assets?',
    type: 'static_select',
    options: ['zero (0)', 'three (3)', 'five (5)', 'eight (8)'],
  },
  {
    id: 'messaging_payment_timeline_from_the_invoice',
    appliesTo: ['messaging'],
    label: 'payment timeline from invoice date?',
    type: 'static_select',
    options: ['30 days', '45 days', '60 days', '90 days'],
  },

  /** ✅ FIXED DATEPICKER */
  {
    id: 'messaging_expiration_date',
    appliesTo: ['messaging'],
    label: 'expiration date',
    type: 'datepicker',
  },

  /** advertisement */
  {
    id: 'advertisement_platforms',
    appliesTo: ['advertisement'],
    label: 'advertising platforms',
    type: 'multi_static_select',
    options: ['google ads', 'facebook', 'instagram', 'linkedin', 'other'],
  },
  {
    id: 'advertisement_budget',
    appliesTo: ['advertisement'],
    label: 'advertising budget',
    type: 'plain_text_input',
    placeholder: 'e.g. 5000 per month',
  },

  /** naming */
  {
    id: 'naming_options',
    appliesTo: ['naming'],
    label: 'how many naming options?',
    type: 'static_select',
    options: ['100', '200', '300', '400'],
  },
];

/** -----------------------------
 * Messaging Complexity Mapping
 * ----------------------------- */
const MESSAGING_COMPLEXITY_QUESTIONS = {
  light: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_primary_target_audiences',
    'messaging_expiration_date',
  ],
  medium: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_facilitate_the_work',
    'messaging_expiration_date',
  ],
  large: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_facilitate_the_work',
    'messaging_expiration_date',
  ],
  'extra large': [
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
  let element;

  if (q.type === 'static_select') {
    element = {
      type: 'static_select',
      action_id: q.id,
      options: q.options.map(o => ({
        text: { type: 'plain_text', text: o },
        value: o,
      })),
      placeholder: { type: 'plain_text', text: 'select…' },
    };
  } else if (q.type === 'multi_static_select') {
    element = {
      type: 'multi_static_select',
      action_id: q.id,
      options: q.options.map(o => ({
        text: { type: 'plain_text', text: o },
        value: o,
      })),
      placeholder: { type: 'plain_text', text: 'select one or more…' },
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
      placeholder: { type: 'plain_text', text: 'select a date' },
    };
  } else {
    throw new Error(`unsupported question type: ${q.type}`);
  }

  return {
    type: 'input',
    block_id: `${q.id}_block`,
    label: { type: 'plain_text', text: q.label },
    element,
  };
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
 * Start App
 * ----------------------------- */
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ slack bolt app is running');
})();
