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
    label: 'How many sharp messaging themes to anchor all launch communications?',
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
    id: 'messaging_topline_demos_of_existing_products',
    appliesTo: ['Messaging'],
    label: 'How many topline demos of existing products and product roadmaps to attend?',
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
  {
    id: 'messaging_top-level_messages',
    appliesTo: ['Messaging'],
    label: 'How many top-level messages are aligned with the strategic vision?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_rounds_of_refinement',
    appliesTo: ['Messaging'],
    label: 'How many rounds of refinement?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_dedicated_rounds_of_internal_feedback',
    appliesTo: ['Messaging'],
    label: 'How many dedicated rounds of internal feedback and revisions to final deliverables?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
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
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Eight (8)'],
  },
  {
    id: 'messaging_interviews_with_internal_stakeholders',
    appliesTo: ['Messaging'],
    label: 'How many interviews with internal stakeholders?',
    type: 'static_select',
    options: ['Zero (0)', 'Three (3)', 'Five (5)', 'Seven (7)'],
  },
  {
    id: 'messaging_best_practices_communication',
    appliesTo: ['Messaging'],
    label: 'How many best practices communication assets?',
    type: 'static_select',
    options: ['Zero (0)', 'Three (3)', 'Five (5)', 'Eight (8)'],
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
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_demos_for_existing_products',
    appliesTo: ['Messaging'],
    label: 'How many demos for existing products to be attended?',
    type: 'static_select',
    options: ['Zero (0)', 'Two (2)', 'Four (4)', 'Six (6)'],
  },
  {
    id: 'messaging_tailored_version_of_the_message_framework',
    appliesTo: ['Messaging'],
    label: 'How many tailored version of the message framework to include messaging?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_high_impact_touchpoints',
    appliesTo: ['Messaging'],
    label: 'How many high-impact touchpoints?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_How_many_product_messages',
    appliesTo: ['Messaging'],
    label: 'How many product messages?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_Recommendations_on_how_product',
    appliesTo: ['Messaging'],
    label: 'How many recommendations on how product messaging integrates?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_60-minute_virtual_workshop',
    appliesTo: ['Messaging'],
    label: 'How many 60-minute virtual workshop?',
    type: 'static_select',
    options: ['Zero (0)', 'One (1)', 'Two (2)', 'Three (3)'],
  },
  {
    id: 'messaging_do’s_and_don’ts_suggestions',
    appliesTo: ['Messaging'],
    label: 'How many tactical do’s and don’ts suggestions?',
    type: 'static_select',
    options: ['Zero (0)', 'Four (4)', 'Eight (8)', 'Twelve (12)'],
  },
  {
    id: 'messaging_clear_behavioral_commitments',
    appliesTo: ['Messaging'],
    label: 'How many clear behavioral commitments?',
    type: 'static_select',
    options: ['Zero (0)', 'Three (3)', 'Five (5)', 'Eight (8)'],
  },

  /** Advertisement-only */
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

  /** Naming-only */
  {
    id: 'naming_creative_territories',
    appliesTo: ['Naming'],
    label: 'Naming: How many unique creative naming territories?',
    type: 'static_select',
    options: ['Two (2)', 'Four (4)', 'Six (6)'],
  },
  {
    id: 'naming_options',
    appliesTo: ['Naming'],
    label: 'Naming: How many naming options?',
    type: 'static_select',
    options: [
      'One Hundred (100)',
      'Two Hundred (200)',
      'Three Hundred (300)',
      'Four Hundred (400)',
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
    options: ['Three (3)', 'Six (6)', 'Eight (8)', 'Ten (10)'],
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
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_primary_target_audiences',
    'messaging_sharp_messaging_themes',
    'messaging_headline_options',
  ],
  Medium: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_topline_demos_of_existing_products',
    'messaging_facilitate_the_work',
    'messaging_top-level_messages',
    'messaging_rounds_of_refinement',
    'messaging_core_messages_aligned',
  ],
  Large: [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_topline_demos_of_existing_products',
    'messaging_interviews_with_internal_stakeholders',
    'messaging_facilitate_the_work',
    'messaging_top-level_messages',
    'messaging_best_practices_communication',
    'messaging_rounds_of_refinement',
    'messaging_core_messages_aligned',
    'messaging_payment_timeline_from_the_invoice',
  ],
  'Extra Large': [
    'client_materials',
    'competitors_analyze',
    'messaging_strategy_session',
    'messaging_demos_for_existing_products',
    'messaging_interviews_with_internal_stakeholders',
    'messaging_facilitate_the_work',
    'messaging_top-level_messages',
    'messaging_best_practices_communication',
    'messaging_rounds_of_refinement',
    'messaging_core_messages_aligned',
    'messaging_payment_timeline_from_the_invoice',
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
    label: {
      type: 'plain_text',
      text: `${service}: Complexity Level`,
    },
    dispatch_action: true,
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

/** -----------------------------
 * Slack app
 * ----------------------------- */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app is running!');
})();
