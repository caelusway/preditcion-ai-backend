// Static data aligned with frontend mockData.json structure

// Betting Tips
export const bettingTips = [
  { code: '1', description: 'Home Team Wins' },
  { code: 'X', description: 'Draw' },
  { code: '2', description: 'Away Team Wins' },
  { code: '1X', description: 'Home Team Wins or Draw' },
  { code: 'X2', description: 'Away Team Wins or Draw' },
  { code: 'GG', description: 'Both Teams Will Score' },
  { code: 'NG', description: "At least one team won't score" },
  { code: 'O0.5', description: 'Over 0.5 Goals' },
  { code: 'U0.5', description: 'Under 0.5 Goals' },
  { code: 'O1.5', description: 'Over 1.5 Goals' },
  { code: 'U1.5', description: 'Under 1.5 Goals' },
  { code: 'O2.5', description: 'Over 2.5 Goals' },
  { code: 'U2.5', description: 'Under 2.5 Goals' },
  { code: 'O3.5', description: 'Over 3.5 Goals' },
  { code: 'U3.5', description: 'Under 3.5 Goals' },
  { code: 'O4.5', description: 'Over 4.5 Goals' },
  { code: 'U4.5', description: 'Under 4.5 Goals' },
  { code: 'HT 1', description: 'Home Team Wins First Half' },
  { code: 'HT X', description: 'Draw at Half Time' },
  { code: 'HT 2', description: 'Away Team Wins First Half' },
  { code: 'CS', description: 'Correct Score' },
  { code: 'DNB', description: 'Draw No Bet' },
  { code: 'DC', description: 'Double Chance' },
  { code: 'AH', description: 'Asian Handicap' },
  { code: 'EH', description: 'European Handicap' },
];

// Navigation menu items
export const navigation = {
  menuItems: [
    { label: 'Bet of the day', route: '/(tabs)', icon: 'star' },
    { label: 'Bankers', route: '/(tabs)/insights', icon: 'football' },
    { label: 'Progress', route: '/(tabs)/progress', icon: 'trending-up' },
    { label: 'Tutorial', route: '/tutorial', icon: 'help-circle' },
    { label: 'Terms and Conditions', route: '/terms-of-service', icon: 'document-text' },
    { label: 'Privacy Policy', route: '/privacy-policy', icon: 'shield-checkmark' },
    { label: 'Contact Us', route: '/help-faq', icon: 'mail' },
  ],
};

// FAQ data
export const faq = {
  categories: [
    {
      title: 'Getting Started',
      icon: 'rocket-outline',
      items: [
        {
          question: 'How do I create an account?',
          answer: 'You can create an account by clicking the "Sign Up" tab on the authentication screen. Enter your name, email, and password, or use the "Continue with Google" option for quick registration.',
        },
        {
          question: 'Is the app free to use?',
          answer: 'Yes! The app is free to download and use. We offer basic predictions and insights at no cost. Premium features with advanced analytics will be available in future updates.',
        },
        {
          question: 'How accurate are the predictions?',
          answer: 'Our AI-powered predictions analyze multiple factors including team form, player statistics, head-to-head records, and injury reports. While we strive for high accuracy, please remember that football is unpredictable and predictions are for informational purposes only.',
        },
      ],
    },
    {
      title: 'Predictions & Insights',
      icon: 'analytics-outline',
      items: [
        {
          question: 'How are match predictions calculated?',
          answer: 'Our AI model analyzes historical data, team performance, player statistics, recent form, injuries, and other relevant factors to generate probability-based predictions for each match outcome (win, draw, loss).',
        },
        {
          question: 'What does AI Confidence mean?',
          answer: 'AI Confidence indicates how certain our model is about the prediction. High confidence means strong data supports the prediction, Medium suggests balanced factors, and Low indicates uncertainty or close competition.',
        },
        {
          question: 'How often are predictions updated?',
          answer: 'Predictions are updated regularly as new data becomes available, including team news, lineup changes, and injury updates. We recommend checking back closer to match time for the most accurate predictions.',
        },
        {
          question: 'Can I view past predictions?',
          answer: 'Currently, the app focuses on upcoming matches. Historical prediction tracking and accuracy reports will be available in a future update.',
        },
      ],
    },
    {
      title: 'Account & Settings',
      icon: 'settings-outline',
      items: [
        {
          question: 'How do I reset my password?',
          answer: 'On the login screen, click "Forgot Password?" and follow the steps to receive a verification code via email. Enter the code and create your new password.',
        },
        {
          question: 'Can I change my notification settings?',
          answer: 'Yes! Go to the Profile tab and toggle "Push Notifications" on or off based on your preference. You can also manage notifications through your device settings.',
        },
        {
          question: 'How do I delete my account?',
          answer: 'Account deletion is not currently available in the app. Please contact our support team at support@aifootballapp.com to request account deletion.',
        },
        {
          question: 'Can I use the app without an account?',
          answer: 'Currently, an account is required to access predictions and insights. This helps us personalize your experience and save your preferences.',
        },
      ],
    },
    {
      title: 'Technical Support',
      icon: 'help-buoy-outline',
      items: [
        {
          question: 'The app is running slowly. What should I do?',
          answer: "Try closing and reopening the app. If the issue persists, clear the app cache from your device settings or reinstall the app. Make sure you're running the latest version.",
        },
        {
          question: "I'm not receiving notifications.",
          answer: 'Check that notifications are enabled in both the app settings (Profile > Push Notifications) and your device settings. Make sure you have a stable internet connection.',
        },
        {
          question: 'The app crashes when I open it.',
          answer: "First, ensure you're using the latest app version. Try restarting your device and reinstalling the app. If the problem continues, contact support with your device model and OS version.",
        },
        {
          question: 'How do I report a bug?',
          answer: 'We appreciate bug reports! Please email support@aifootballapp.com with a description of the issue, steps to reproduce it, and screenshots if possible.',
        },
      ],
    },
  ],
  supportEmail: 'support@aifootballapp.com',
};

// Settings options
export const settings = {
  languages: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  ],
  oddsFormats: [
    { code: 'decimal', name: 'Decimal (1.50)' },
    { code: 'fractional', name: 'Fractional (1/2)' },
    { code: 'american', name: 'American (-200)' },
  ],
  timezones: [
    { code: 'UTC', name: 'UTC (GMT+0)' },
    { code: 'Europe/London', name: 'London (GMT+0/+1)' },
    { code: 'Europe/Istanbul', name: 'Istanbul (GMT+3)' },
    { code: 'America/New_York', name: 'New York (GMT-5/-4)' },
    { code: 'America/Los_Angeles', name: 'Los Angeles (GMT-8/-7)' },
  ],
};

// Onboarding screens
export const onboarding = {
  screens: [
    {
      id: 1,
      title: 'AI-Powered Predictions',
      description: 'Get accurate match predictions powered by advanced AI algorithms analyzing thousands of data points.',
      image: 'onboarding_predictions',
    },
    {
      id: 2,
      title: 'Real-Time Insights',
      description: 'Stay updated with live match statistics, team form analysis, and betting trends.',
      image: 'onboarding_insights',
    },
    {
      id: 3,
      title: 'Track Your Success',
      description: 'Monitor your prediction accuracy and improve your betting strategy over time.',
      image: 'onboarding_tracking',
    },
  ],
};

// Home stats
export const homeStats = {
  predicted: 571,
  upcoming: 536,
  won: 23,
};

// Date filters
export const dateFilters = ['yesterday', 'today', 'tomorrow'];

// Match type filters
export const matchTypeFilters = ['all', 'upcoming'];

// Time filters
export const timeFilters = ['week', 'month'];

// Confidence levels
export const confidenceLevels = ['High', 'Medium', 'Low'];

// Complete static data object
export const staticData = {
  bettingTips,
  navigation,
  faq,
  settings,
  onboarding,
  homeStats,
  dateFilters,
  matchTypeFilters,
  timeFilters,
  confidenceLevels,
};

