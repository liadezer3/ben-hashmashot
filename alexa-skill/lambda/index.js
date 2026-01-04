/**
 * Alexa Skill Lambda Function for Shabbat Times
 * 
 * This Lambda function connects to your Supabase Edge Function
 * to provide Shabbat times via Alexa.
 */

const Alexa = require('ask-sdk-core');

// Your Supabase Edge Function URL
const SHABBAT_API_URL = 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/shabbat-api';

// Helper function to fetch Shabbat times
async function getShabbatTimes(city = 'Jerusalem') {
  try {
    const response = await fetch(`${SHABBAT_API_URL}?city=${encodeURIComponent(city)}&format=json`);
    if (!response.ok) {
      throw new Error('Failed to fetch Shabbat times');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Shabbat times:', error);
    return null;
  }
}

// Launch Request Handler
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const speakOutput = isHebrew
      ? 'שלום! אני יכול לספר לך על זמני שבת, פרשת השבוע והחגים הקרובים. מה תרצה לדעת?'
      : 'Hello! I can tell you about Shabbat times, the weekly Torah portion, and upcoming holidays. What would you like to know?';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Get Shabbat Times Intent Handler
const GetShabbatTimesIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetShabbatTimesIntent';
  },
  async handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    // Get city from slot or default to Jerusalem
    const citySlot = handlerInput.requestEnvelope.request.intent.slots?.city;
    const city = citySlot?.value || (isHebrew ? 'ירושלים' : 'Jerusalem');
    
    const data = await getShabbatTimes(city);
    
    if (!data) {
      const errorMessage = isHebrew
        ? 'מצטער, לא הצלחתי לקבל את זמני השבת. נסה שוב מאוחר יותר.'
        : 'Sorry, I could not get the Shabbat times. Please try again later.';
      return handlerInput.responseBuilder.speak(errorMessage).getResponse();
    }
    
    const speakOutput = isHebrew
      ? `זמני שבת ב${data.city}: פרשת ${data.parsha}. הדלקת נרות: ${data.candleLighting}. הבדלה: ${data.havdalah}. שבת שלום!`
      : `Shabbat times in ${data.city}: Parshat ${data.parshaEnglish}. Candle lighting: ${data.candleLighting}. Havdalah: ${data.havdalah}. Shabbat Shalom!`;
    
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

// Get Parsha Intent Handler
const GetParshaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetParshaIntent';
  },
  async handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const data = await getShabbatTimes();
    
    if (!data) {
      const errorMessage = isHebrew
        ? 'מצטער, לא הצלחתי לקבל את פרשת השבוע.'
        : 'Sorry, I could not get the weekly parsha.';
      return handlerInput.responseBuilder.speak(errorMessage).getResponse();
    }
    
    const speakOutput = isHebrew
      ? `פרשת השבוע היא פרשת ${data.parsha}.`
      : `This week's Torah portion is Parshat ${data.parshaEnglish}.`;
    
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

// Get Candle Lighting Intent Handler
const GetCandleLightingIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetCandleLightingIntent';
  },
  async handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const citySlot = handlerInput.requestEnvelope.request.intent.slots?.city;
    const city = citySlot?.value || (isHebrew ? 'ירושלים' : 'Jerusalem');
    
    const data = await getShabbatTimes(city);
    
    if (!data) {
      const errorMessage = isHebrew
        ? 'מצטער, לא הצלחתי לקבל את זמן הדלקת נרות.'
        : 'Sorry, I could not get the candle lighting time.';
      return handlerInput.responseBuilder.speak(errorMessage).getResponse();
    }
    
    const speakOutput = isHebrew
      ? `הדלקת נרות ב${data.city}: ${data.candleLighting}.`
      : `Candle lighting in ${data.city}: ${data.candleLighting}.`;
    
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

// Get Havdalah Intent Handler
const GetHavdalahIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetHavdalahIntent';
  },
  async handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const citySlot = handlerInput.requestEnvelope.request.intent.slots?.city;
    const city = citySlot?.value || (isHebrew ? 'ירושלים' : 'Jerusalem');
    
    const data = await getShabbatTimes(city);
    
    if (!data) {
      const errorMessage = isHebrew
        ? 'מצטער, לא הצלחתי לקבל את זמן ההבדלה.'
        : 'Sorry, I could not get the havdalah time.';
      return handlerInput.responseBuilder.speak(errorMessage).getResponse();
    }
    
    const speakOutput = isHebrew
      ? `הבדלה ב${data.city}: ${data.havdalah}.`
      : `Havdalah in ${data.city}: ${data.havdalah}.`;
    
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

// Help Intent Handler
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const speakOutput = isHebrew
      ? 'אתה יכול לשאול אותי על זמני שבת, הדלקת נרות, הבדלה או פרשת השבוע. לדוגמה, תגיד: מתי הדלקת נרות בתל אביב?'
      : 'You can ask me about Shabbat times, candle lighting, havdalah, or the weekly Torah portion. For example, say: When is candle lighting in New York?';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Cancel and Stop Intent Handler
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const speakOutput = isHebrew ? 'שבת שלום!' : 'Shabbat Shalom!';
    
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

// Fallback Intent Handler
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const speakOutput = isHebrew
      ? 'מצטער, לא הבנתי. נסה לשאול על זמני שבת או פרשת השבוע.'
      : 'Sorry, I didn\'t understand. Try asking about Shabbat times or the weekly parsha.';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Session Ended Request Handler
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

// Error Handler
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`Error handled: ${error.message}`);
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const isHebrew = locale.startsWith('he');
    
    const speakOutput = isHebrew
      ? 'מצטער, קרתה שגיאה. נסה שוב.'
      : 'Sorry, an error occurred. Please try again.';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Export the handler
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GetShabbatTimesIntentHandler,
    GetParshaIntentHandler,
    GetCandleLightingIntentHandler,
    GetHavdalahIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
