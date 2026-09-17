// ==================================================
// AI VOICE ASSISTANT
// ==================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


// ==================================================
// GLOBAL VARIABLES
// ==================================================

let recognition = null;

let shouldListen = false;

let assistantMode = "standby";

let isRecognitionRunning = false;

let language = "en-IN";


// ==================================================
// ELEMENTS
// ==================================================

const statusElement =
    document.getElementById("status");

const startBtn =
    document.getElementById("startBtn");

const userText =
    document.getElementById("userText");

const assistantText =
    document.getElementById("assistantText");

const languageSelect =
    document.getElementById("languageSelect");


// ==================================================
// SPEECH SYNTHESIS
// ==================================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang =
        language === "hi-IN"
            ? "hi-IN"
            : "en-IN";

    speech.rate = 0.95;

    speech.pitch = 1;

    window.speechSynthesis.speak(
        speech
    );
}


// ==================================================
// DISPLAY
// ==================================================

function displayUserText(text) {

    if (userText) {
        userText.textContent = text;
    }
}


function displayAssistantText(text) {

    if (assistantText) {
        assistantText.textContent = text;
    }
}


// ==================================================
// SAVE COMMAND
// ==================================================

async function saveCommand(
    command,
    response,
    type = "general"
) {

    try {

        await fetch(
            "/save-command",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    user_command:
                        command,

                    assistant_response:
                        response,

                    command_type:
                        type

                })
            }
        );

    } catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );
    }
}


// ==================================================
// RESPOND
// ==================================================

function respond(
    text,
    type = "general"
) {

    displayAssistantText(text);

    speak(text);

    if (window.currentUserCommand) {

        saveCommand(
            window.currentUserCommand,
            text,
            type
        );

    }
}


// ==================================================
// GREETING
// ==================================================

function getGreeting() {

    const hour =
        new Date().getHours();

    if (hour < 12) {

        return "Good Morning Abhay";

    }

    if (hour < 17) {

        return "Good Afternoon Abhay";

    }

    return "Good Evening Abhay";
}


// ==================================================
// SPEECH RECOGNITION
// ==================================================

function setupRecognition() {

    if (!SpeechRecognition) {

        displayAssistantText(
            "Speech Recognition browser mein supported nahi hai. Chrome use karein."
        );

        return false;
    }


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.maxAlternatives =
        1;


    recognition.lang =
        language;


    recognition.onstart =
        function () {

            isRecognitionRunning =
                true;

            if (assistantMode === "active") {

                statusElement.textContent =
                    "● Listening...";

            } else {

                statusElement.textContent =
                    "● Standby - Say Chalu";
            }

        };


    recognition.onresult =
        async function (event) {

            const transcript =
                event.results[0][0]
                    .transcript
                    .toLowerCase()
                    .trim();


            displayUserText(
                transcript
            );


            window.currentUserCommand =
                transcript;


            await processCommand(
                transcript
            );

        };


    recognition.onerror =
        function (event) {

            console.log(
                "Recognition error:",
                event.error
            );

            if (
                event.error ===
                "not-allowed"
            ) {

                statusElement.textContent =
                    "● Microphone permission required";

                shouldListen = false;

                assistantMode =
                    "standby";

            }

        };


    recognition.onend =
        function () {

            isRecognitionRunning =
                false;


            if (shouldListen) {

                setTimeout(
                    function () {

                        startRecognition();

                    },
                    700
                );

            }

        };


    return true;
}


// ==================================================
// START RECOGNITION
// ==================================================

function startRecognition() {

    if (!recognition) {
        return;
    }

    if (!shouldListen) {
        return;
    }

    if (isRecognitionRunning) {
        return;
    }


    try {

        recognition.lang =
            language;

        recognition.start();

    } catch (error) {

        console.log(
            "Recognition start error:",
            error
        );

    }
}


// ==================================================
// LANGUAGE
// ==================================================

if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        function () {

            language =
                languageSelect.value;

            if (recognition) {

                recognition.lang =
                    language;

            }

        }
    );

}


// ==================================================
// START BUTTON
// ==================================================

if (startBtn) {

    startBtn.addEventListener(
        "click",
        function () {

            if (!recognition) {

                const ready =
                    setupRecognition();

                if (!ready) {
                    return;
                }

            }


            // ACTIVE -> STANDBY
            if (
                assistantMode ===
                "active"
            ) {

                assistantMode =
                    "standby";

                shouldListen =
                    true;

                startBtn.textContent =
                    "🎤 Start Assistant";

                statusElement.textContent =
                    "● Standby - Say Chalu";

                speak(
                    "Assistant standby mode mein hai. Chalu bolkar mujhe activate karein."
                );

                setTimeout(
                    startRecognition,
                    1500
                );

                return;
            }


            // STANDBY -> ACTIVE
            assistantMode =
                "active";

            shouldListen =
                true;

            startBtn.textContent =
                "🛑 Stop Assistant";

            statusElement.textContent =
                "● Assistant Active";


            const greeting =
                getGreeting();

            displayAssistantText(
                greeting
                + ". Main aapki kya sahayata kar sakta hoon?"
            );


            speak(
                greeting
                + ". Main aapki kya sahayata kar sakta hoon?"
            );


            setTimeout(
                startRecognition,
                1800
            );

        }
    );

}


// ==================================================
// PROCESS COMMAND
// ==================================================

async function processCommand(
    command
) {

    command =
        command.toLowerCase()
            .trim();


    // ----------------------------------------------
    // WAKE WORD
    // ----------------------------------------------

    if (
        command.includes("chalu") ||
        command.includes("chalo") ||
        command.includes("start") ||
        command.includes("shuru")
    ) {

        assistantMode =
            "active";

        shouldListen =
            true;

        startBtn.textContent =
            "🛑 Stop Assistant";

        statusElement.textContent =
            "● Assistant Active";


        const greeting =
            getGreeting();


        respond(
            greeting
            + ". Main aapki kya sahayata kar sakta hoon?",
            "Wake Word"
        );


        setTimeout(
            startRecognition,
            1800
        );

        return;
    }


    // ----------------------------------------------
    // BAND / STOP
    // ----------------------------------------------

    if (
        command.includes("band") ||
        command.includes("stop") ||
        command.includes("ruko")
    ) {

        assistantMode =
            "standby";

        shouldListen =
            true;


        startBtn.textContent =
            "🎤 Start Assistant";


        statusElement.textContent =
            "● Standby - Say Chalu";


        speak(
            "Assistant standby mode mein hai. Chalu bolkar mujhe activate karein."
        );


        setTimeout(
            startRecognition,
            1500
        );

        return;
    }


    // ----------------------------------------------
    // STANDBY MODE
    // ----------------------------------------------

    if (
        assistantMode ===
        "standby"
    ) {

        return;
    }


    // ----------------------------------------------
    // HISTORY
    // ----------------------------------------------

    if (
        isHistoryCommand(command)
    ) {

        await handleHistoryVoiceCommand(
            command
        );

        return;
    }


    // ----------------------------------------------
    // CALCULATOR
    // ----------------------------------------------

    if (
        isCalculatorCommand(command)
    ) {

        handleVoiceCalculation(
            command
        );

        return;
    }


    // ----------------------------------------------
    // WEATHER
    // ----------------------------------------------

    if (
        isWeatherCommand(command)
    ) {

        await handleWeatherVoice(
            command
        );

        return;
    }


    // ----------------------------------------------
    // WORLD CLOCK
    // ----------------------------------------------

    if (
        isWorldClockCommand(command)
    ) {

        handleWorldClockVoice(
            command
        );

        return;
    }


    // ----------------------------------------------
    // AI CHAT VOICE
    // ----------------------------------------------

    if (
        isAIChatCommand(command)
    ) {

        await handleAIChatVoice(
            command
        );

        return;
    }


    // ----------------------------------------------
    // GENERAL QUESTION / WEB SEARCH
    // ----------------------------------------------

    if (
        isGeneralQuestion(command)
    ) {

        await handleGeneralQuestion(
            command
        );

        return;
    }


    // ----------------------------------------------
    // GREETING
    // ----------------------------------------------

    if (
        command.includes("hello") ||
        command.includes("hi") ||
        command.includes("namaste")
    ) {

        respond(
            getGreeting()
            + ". Main aapki kya sahayata kar sakta hoon?",
            "Greeting"
        );

        return;
    }


    // ----------------------------------------------
    // NAME
    // ----------------------------------------------

    if (
        command.includes("my name") ||
        command.includes("mera naam") ||
        command.includes("what is my name")
    ) {

        respond(
            "Aapka naam Abhay hai.",
            "Personal"
        );

        return;
    }


    // ----------------------------------------------
    // HOW ARE YOU
    // ----------------------------------------------

    if (
        command.includes("how are you") ||
        command.includes("kaise ho")
    ) {

        respond(
            "Main bilkul theek hoon Abhay. Aapki help ke liye ready hoon.",
            "Conversation"
        );

        return;
    }


    // ----------------------------------------------
    // TIME
    // ----------------------------------------------

    if (
        command === "time" ||
        command.includes("what time") ||
        command.includes("kitne baje")
    ) {

        const now =
            new Date();

        const time =
            now.toLocaleTimeString(
                "en-IN",
                {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        respond(
            "Abhi time hai "
            + time,
            "Time"
        );

        return;
    }


    // ----------------------------------------------
    // DATE
    // ----------------------------------------------

    if (
        command === "date" ||
        command.includes("today date") ||
        command.includes("aaj ki date")
    ) {

        const now =
            new Date();

        const date =
            now.toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );


        respond(
            "Aaj ki date hai "
            + date,
            "Date"
        );

        return;
    }


    // ----------------------------------------------
    // GOOGLE
    // ----------------------------------------------

    if (
        command.includes("open google") ||
        command.includes("google kholo")
    ) {

        respond(
            "Google open kar raha hoon.",
            "Browser"
        );

        window.open(
            "https://www.google.com",
            "_blank"
        );

        return;
    }


    // ----------------------------------------------
    // YOUTUBE
    // ----------------------------------------------

    if (
        command.includes("open youtube") ||
        command.includes("youtube kholo")
    ) {

        respond(
            "YouTube open kar raha hoon.",
            "Browser"
        );

        window.open(
            "https://www.youtube.com",
            "_blank"
        );

        return;
    }


    // ----------------------------------------------
    // THANK YOU
    // ----------------------------------------------

    if (
        command.includes("thank you") ||
        command.includes("thanks")
    ) {

        respond(
            "You're welcome Abhay.",
            "Conversation"
        );

        return;
    }


    // ----------------------------------------------
    // UNKNOWN
    // ----------------------------------------------

    respond(
        "Sorry Abhay, main is command ko samajh nahi paya.",
        "Unknown"
    );
}


// ==================================================
// GENERAL QUESTION
// ==================================================

function isGeneralQuestion(command) {

    const phrases = [

        "who is",
        "what is",
        "what are",
        "where is",
        "when is",
        "when was",
        "why is",
        "why are",
        "how is",
        "how does",
        "how do",
        "how can",
        "tell me about",
        "explain",
        "define",
        "search",
        "find"

    ];


    return phrases.some(
        phrase =>
            command.includes(phrase)
    );
}


async function handleGeneralQuestion(
    question
) {

    try {

        const response =
            await fetch(
                "/web-search",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        query: question
                    })
                }
            );


        const data =
            await response.json();


        if (data.success) {

            displayAssistantText(
                data.answer
            );

            speak(
                data.answer.substring(
                    0,
                    450
                )
            );


            saveCommand(
                question,
                data.answer,
                "Web Search"
            );

        } else {

            respond(
                data.answer,
                "Web Search"
            );

        }

    } catch (error) {

        console.error(
            error
        );

        respond(
            "Internet search abhi available nahi hai.",
            "Web Search"
        );

    }
}


// ==================================================
// AI CHAT
// ==================================================

function isAIChatCommand(command) {

    const phrases = [

        "ask ai",
        "ai se pucho",
        "ai ko pucho",
        "ai batao",
        "smart answer",
        "answer this",
        "explain this"

    ];


    return phrases.some(
        phrase =>
            command.includes(phrase)
    );
}


async function handleAIChatVoice(
    command
) {

    let question =
        command;


    const removePhrases = [

        "ask ai",
        "ai se pucho",
        "ai ko pucho",
        "ai batao",
        "smart answer",
        "answer this",
        "explain this"

    ];


    removePhrases.forEach(
        phrase => {

            question =
                question.replace(
                    phrase,
                    ""
                );

        }
    );


    question =
        question.trim();


    if (!question) {

        respond(
            "Aap apna question bataiye.",
            "AI Chat"
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/ai-chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question:
                            question
                    })
                }
            );


        const data =
            await response.json();


        if (data.success) {

            displayAssistantText(
                data.answer
            );


            speak(
                data.answer.substring(
                    0,
                    450
                )
            );

        } else {

            respond(
                data.answer,
                "AI Chat"
            );

        }

    } catch (error) {

        console.error(
            "AI CHAT ERROR:",
            error
        );

        respond(
            "AI service abhi available nahi hai.",
            "AI Chat"
        );

    }
}


// ==================================================
// WEATHER
// ==================================================

const weatherSearch =
    document.getElementById(
        "weatherSearch"
    );

const weatherSearchBtn =
    document.getElementById(
        "weatherSearchBtn"
    );

const weatherResult =
    document.getElementById(
        "weatherResult"
    );


function isWeatherCommand(
    command
) {

    return (
        command.includes("weather") ||
        command.includes("mausam") ||
        command.includes("temperature") ||
        command.includes("temp")
    );
}


async function getWeather(
    city
) {

    try {

        weatherResult.innerHTML =
            "<p>Weather loading...</p>";


        const geoURL =
            "https://geocoding-api.open-meteo.com/v1/search"
            + "?name="
            + encodeURIComponent(city)
            + "&count=1"
            + "&language=en"
            + "&format=json";


        const geoResponse =
            await fetch(
                geoURL
            );


        const geoData =
            await geoResponse.json();


        if (
            !geoData.results ||
            !geoData.results.length
        ) {

            weatherResult.innerHTML =
                "<p>City nahi mili.</p>";

            return null;
        }


        const location =
            geoData.results[0];


        const weatherURL =
            "https://api.open-meteo.com/v1/forecast"
            + "?latitude="
            + location.latitude
            + "&longitude="
            + location.longitude
            + "&current="
            + "temperature_2m,"
            + "relative_humidity_2m,"
            + "weather_code,"
            + "wind_speed_10m"
            + "&timezone=auto";


        const weatherResponse =
            await fetch(
                weatherURL
            );


        const data =
            await weatherResponse.json();


        const current =
            data.current;


        const condition =
            getWeatherCondition(
                current.weather_code
            );


        const icon =
            condition.icon;


        weatherResult.innerHTML = `

            <div class="weather-card">

                <h3>
                    ${location.name},
                    ${location.country || ""}
                </h3>

                <div class="weather-icon">
                    ${icon}
                </div>

                <div class="weather-temp">
                    ${current.temperature_2m}°C
                </div>

                <div class="weather-condition">
                    ${condition.text}
                </div>

                <div class="weather-details">

                    <div class="weather-detail">
                        💧 Humidity<br>
                        ${current.relative_humidity_2m}%
                    </div>

                    <div class="weather-detail">
                        💨 Wind<br>
                        ${current.wind_speed_10m} km/h
                    </div>

                    <div class="weather-detail">
                        🌡️ Temperature<br>
                        ${current.temperature_2m}°C
                    </div>

                </div>

            </div>

        `;


        return {
            city: location.name,
            temperature:
                current.temperature_2m,
            condition:
                condition.text
        };

    } catch (error) {

        console.error(
            "WEATHER ERROR:",
            error
        );

        weatherResult.innerHTML =
            "<p>Weather service unavailable.</p>";

        return null;
    }
}


function getWeatherCondition(
    code
) {

    if (code === 0) {

        return {
            text: "Clear Sky",
            icon: "☀️"
        };

    }

    if (
        code === 1 ||
        code === 2 ||
        code === 3
    ) {

        return {
            text: "Partly Cloudy",
            icon: "⛅"
        };

    }

    if (
        code >= 45 &&
        code <= 48
    ) {

        return {
            text: "Foggy",
            icon: "🌫️"
        };

    }

    if (
        code >= 51 &&
        code <= 67
    ) {

        return {
            text: "Rain",
            icon: "🌧️"
        };

    }

    if (
        code >= 71 &&
        code <= 77
    ) {

        return {
            text: "Snow",
            icon: "❄️"
        };

    }

    if (
        code >= 80 &&
        code <= 82
    ) {

        return {
            text: "Rain Showers",
            icon: "🌦️"
        };

    }

    if (
        code >= 95
    ) {

        return {
            text: "Thunderstorm",
            icon: "⛈️"
        };

    }

    return {
        text: "Unknown",
        icon: "🌤️"
    };
}


async function handleWeatherVoice(
    command
) {

    let city =
        extractWeatherCity(
            command
        );


    if (!city) {

        respond(
            "Aap kis city ka weather jaana chahte hain?",
            "Weather"
        );

        return;
    }


    const result =
        await getWeather(
            city
        );


    if (result) {

        const response =
            result.city
            + " mein temperature "
            + result.temperature
            + " degree Celsius hai. "
            + "Weather condition "
            + result.condition
            + " hai.";


        displayAssistantText(
            response
        );

        speak(response);


        saveCommand(
            command,
            response,
            "Weather"
        );
    }
}


function extractWeatherCity(
    command
) {

    const cities = [

        "Delhi",
        "Mumbai",
        "Noida",
        "Lucknow",
        "London",
        "Tokyo",
        "Dubai",
        "New York",
        "Paris",
        "Berlin",
        "Singapore",
        "Sydney",
        "Toronto",
        "Bangalore",
        "Kolkata",
        "Chennai",
        "Hyderabad",
        "Pune"

    ];


    for (
        const city of cities
    ) {

        if (
            command.includes(
                city.toLowerCase()
            )
        ) {

            return city;
        }

    }


    return null;
}


if (weatherSearchBtn) {

    weatherSearchBtn.addEventListener(
        "click",
        function () {

            const city =
                weatherSearch.value.trim();

            if (city) {

                getWeather(city);

            }

        }
    );

}


document
    .querySelectorAll(
        ".quick-cities button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const city =
                        button.dataset.city;

                    weatherSearch.value =
                        city;

                    getWeather(city);

                }
            );

        }
    );


// ==================================================
// WORLD CLOCK
// ==================================================

const citySelect =
    document.getElementById(
        "citySelect"
    );

const selectedCity =
    document.getElementById(
        "selectedCity"
    );

const worldTime =
    document.getElementById(
        "worldTime"
    );

const worldDate =
    document.getElementById(
        "worldDate"
    );


function updateWorldClock() {

    if (!citySelect) {
        return;
    }


    const timezone =
        citySelect.value;


    const cityName =
        citySelect
            .options[
                citySelect.selectedIndex
            ]
            .text;


    selectedCity.textContent =
        cityName;


    const now =
        new Date();


    worldTime.textContent =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    timezone,

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    true
            }
        ).format(now);


    worldDate.textContent =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    timezone,

                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        ).format(now);
}


if (citySelect) {

    citySelect.addEventListener(
        "change",
        updateWorldClock
    );

    updateWorldClock();

    setInterval(
        updateWorldClock,
        1000
    );

}


function isWorldClockCommand(
    command
) {

    return (
        command.includes("world time") ||
        command.includes("world clock") ||
        command.includes("time in") ||
        command.includes("ka time") ||
        command.includes("mein kitne baje") ||
        command.includes("mein time")
    );
}


function handleWorldClockVoice(
    command
) {

    const cities = {

        "delhi":
            "Asia/Kolkata",

        "india":
            "Asia/Kolkata",

        "new york":
            "America/New_York",

        "america":
            "America/New_York",

        "los angeles":
            "America/Los_Angeles",

        "london":
            "Europe/London",

        "uk":
            "Europe/London",

        "paris":
            "Europe/Paris",

        "france":
            "Europe/Paris",

        "berlin":
            "Europe/Berlin",

        "germany":
            "Europe/Berlin",

        "dubai":
            "Asia/Dubai",

        "uae":
            "Asia/Dubai",

        "singapore":
            "Asia/Singapore",

        "tokyo":
            "Asia/Tokyo",

        "japan":
            "Asia/Tokyo",

        "sydney":
            "Australia/Sydney",

        "australia":
            "Australia/Sydney",

        "toronto":
            "America/Toronto",

        "canada":
            "America/Toronto"

    };


    let timezone =
        null;

    let cityName =
        null;


    for (
        const city in cities
    ) {

        if (
            command.includes(city)
        ) {

            timezone =
                cities[city];

            cityName =
                city;

            break;
        }

    }


    if (!timezone) {

        respond(
            "Please city ka naam batayein.",
            "World Clock"
        );

        return;
    }


    const now =
        new Date();


    const time =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    timezone,

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    true
            }
        ).format(now);


    const response =
        cityName
        + " mein abhi time hai "
        + time;


    respond(
        response,
        "World Clock"
    );
}


// ==================================================
// CALCULATOR
// ==================================================

const calcDisplay =
    document.getElementById(
        "calcDisplay"
    );


let calculatorExpression =
    "";


document
    .querySelectorAll(
        ".calculator-buttons button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const value =
                        button.dataset.value;


                    if (
                        value === "C"
                    ) {

                        calculatorExpression =
                            "";

                        calcDisplay.value =
                            "0";

                        return;
                    }


                    if (
                        value === "="
                    ) {

                        calculateDisplay();

                        return;
                    }


                    calculatorExpression +=
                        value;

                    calcDisplay.value =
                        calculatorExpression;

                }
            );

        }
    );


function calculateDisplay() {

    if (
        !calculatorExpression
    ) {
        return;
    }


    try {

        if (
            !/^[0-9+\-*/().\s]+$/
                .test(
                    calculatorExpression
                )
        ) {

            throw new Error(
                "Invalid expression"
            );
        }


        const result =
            Function(
                '"use strict"; return ('
                + calculatorExpression
                + ')'
            )();


        calcDisplay.value =
            result;

        calculatorExpression =
            String(result);

    } catch (error) {

        calcDisplay.value =
            "Error";

        calculatorExpression =
            "";

    }
}


function isCalculatorCommand(
    command
) {

    return (
        command.includes("calculate") ||
        command.includes("plus") ||
        command.includes("minus") ||
        command.includes("multiply") ||
        command.includes("times") ||
        command.includes("divided by") ||
        command.includes("into")
    );
}


function handleVoiceCalculation(
    command
) {

    let expression =
        command;


    expression =
        expression
            .replace(
                /calculate/g,
                ""
            )
            .replace(
                /what is/g,
                ""
            )
            .replace(
                /plus/g,
                "+"
            )
            .replace(
                /minus/g,
                "-"
            )
            .replace(
                /multiply by/g,
                "*"
            )
            .replace(
                /multiply/g,
                "*"
            )
            .replace(
                /times/g,
                "*"
            )
            .replace(
                /divided by/g,
                "/"
            )
            .replace(
                /divide by/g,
                "/"
            )
            .replace(
                /into/g,
                "*"
            );


    expression =
        expression.replace(
            /[^0-9+\-*/().\s]/g,
            ""
        );


    if (!expression.trim()) {

        respond(
            "Calculation samajh nahi aayi.",
            "Calculator"
        );

        return;
    }


    try {

        const result =
            Function(
                '"use strict"; return ('
                + expression
                + ')'
            )();


        const response =
            "Answer is "
            + result;


        calcDisplay.value =
            result;


        calculatorExpression =
            String(result);


        respond(
            response,
            "Calculator"
        );

    } catch (error) {

        respond(
            "Calculation nahi ho paayi.",
            "Calculator"
        );

    }
}


// ==================================================
// HISTORY KNOWLEDGE
// ==================================================

const historyDatabase = {

    "First Prime Minister of India": {
        title:
            "First Prime Minister of India",

        answer:
            "Jawaharlal Nehru was the first Prime Minister of independent India. He served from 15 August 1947 to 27 May 1964."
    },


    "Second Prime Minister of India": {
        title:
            "Second Prime Minister of India",

        answer:
            "Lal Bahadur Shastri was the second Prime Minister of India. He served from 9 June 1964 to 11 January 1966."
    },


    "Indian Independence": {
        title:
            "Indian Independence",

        answer:
            "India became independent from British rule on 15 August 1947. Jawaharlal Nehru became the first Prime Minister of independent India."
    },


    "Revolt of 1857": {
        title:
            "Revolt of 1857",

        answer:
            "The Revolt of 1857 was a major uprising against British rule in India. Important figures associated with the uprising included Mangal Pandey, Rani Lakshmibai, Bahadur Shah Zafar and Nana Sahib."
    },


    "World War I": {
        title:
            "World War I",

        answer:
            "World War I lasted from 1914 to 1918. The assassination of Archduke Franz Ferdinand was the immediate trigger, while alliances, militarism, imperial competition and nationalism were major underlying factors."
    },


    "World War II": {
        title:
            "World War II",

        answer:
            "World War II lasted from 1939 to 1945. Germany's invasion of Poland in September 1939 led Britain and France to declare war on Germany. The war resulted in enormous military and civilian casualties and major geopolitical changes."
    },


    "Cold War": {
        title:
            "Cold War",

        answer:
            "The Cold War was a prolonged geopolitical rivalry between the United States and the Soviet Union and their respective allies after World War II. It involved political, military, technological and ideological competition."
    },


    "French Revolution": {
        title:
            "French Revolution",

        answer:
            "The French Revolution began in 1789 and brought major political and social changes in France. It challenged the existing monarchy and contributed to the rise of republican government and new political ideas."
    }

};


function isHistoryCommand(
    command
) {

    return (
        command.includes("history") ||
        command.includes("historical") ||
        command.includes("first pm") ||
        command.includes("second pm") ||
        command.includes("world war") ||
        command.includes("cold war") ||
        command.includes("french revolution") ||
        command.includes("revolt of 1857") ||
        command.includes("independence")
    );
}


function findHistoryTopic(
    command
) {

    const map = {

        "first pm":
            "First Prime Minister of India",

        "first prime minister":
            "First Prime Minister of India",

        "jawaharlal nehru":
            "First Prime Minister of India",

        "second pm":
            "Second Prime Minister of India",

        "second prime minister":
            "Second Prime Minister of India",

        "lal bahadur shastri":
            "Second Prime Minister of India",

        "independence":
            "Indian Independence",

        "indian independence":
            "Indian Independence",

        "1857":
            "Revolt of 1857",

        "revolt of 1857":
            "Revolt of 1857",

        "world war 1":
            "World War I",

        "world war i":
            "World War I",

        "first world war":
            "World War I",

        "world war 2":
            "World War II",

        "world war ii":
            "World War II",

        "second world war":
            "World War II",

        "cold war":
            "Cold War",

        "french revolution":
            "French Revolution"

    };


    for (
        const key in map
    ) {

        if (
            command.includes(key)
        ) {

            return map[key];
        }

    }


    return null;
}


function showHistory(
    topic
) {

    const result =
        historyDatabase[topic];


    const historyResult =
        document.getElementById(
            "historyResult"
        );


    if (!result) {

        historyResult.innerHTML =
            "<p>Topic nahi mila.</p>";

        return;
    }


    historyResult.innerHTML = `

        <h3>
            ${result.title}
        </h3>

        <p>
            ${result.answer}
        </p>

    `;
}


function handleHistoryVoiceCommand(
    command
) {

    const topic =
        findHistoryTopic(
            command
        );


    if (!topic) {

        respond(
            "Please history ka specific topic batayein.",
            "History"
        );

        return;
    }


    const result =
        historyDatabase[topic];


    showHistory(topic);


    respond(
        result.answer,
        "History"
    );
}


document
    .querySelectorAll(
        ".history-topics button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const topic =
                        button.dataset.topic;

                    showHistory(topic);

                }
            );

        }
    );


const historySearch =
    document.getElementById(
        "historySearch"
    );


const historySearchBtn =
    document.getElementById(
        "historySearchBtn"
    );


function searchHistory() {

    const query =
        historySearch.value
            .toLowerCase()
            .trim();


    const historyResult =
        document.getElementById(
            "historyResult"
        );


    for (
        const topic in historyDatabase
    ) {

        if (
            topic
                .toLowerCase()
                .includes(query)
        ) {

            showHistory(topic);

            return;
        }

    }


    historyResult.innerHTML =
        "<p>History topic nahi mila.</p>";
}


if (historySearchBtn) {

    historySearchBtn.addEventListener(
        "click",
        searchHistory
    );

}


// ==================================================
// WEB SEARCH UI
// ==================================================

const webSearchInput =
    document.getElementById(
        "webSearchInput"
    );


const webSearchBtn =
    document.getElementById(
        "webSearchBtn"
    );


const webSearchResult =
    document.getElementById(
        "webSearchResult"
    );


async function performWebSearch(
    query
) {

    query =
        query.trim();


    if (!query) {

        webSearchResult.innerHTML =
            "<p>Please search query enter karein.</p>";

        return;
    }


    webSearchResult.innerHTML =
        "<p>🔎 Searching...</p>";


    try {

        const response =
            await fetch(
                "/web-search",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        query:
                            query
                    })
                }
            );


        const data =
            await response.json();


        if (
            data.success
        ) {

            webSearchResult.innerHTML = `

                <strong>
                    🔎 Result
                </strong>

                <p>
                    ${escapeHTML(
                        data.answer
                    )}
                </p>

                ${
                    data.source
                    ?
                    `<small>
                        Source:
                        ${escapeHTML(
                            data.source
                        )}
                    </small>`
                    :
                    ""
                }

            `;

        } else {

            webSearchResult.innerHTML =
                `<p>
                    ${escapeHTML(
                        data.answer
                    )}
                </p>`;

        }

    } catch (error) {

        console.error(
            error
        );

        webSearchResult.innerHTML =
            "<p>Search service unavailable.</p>";

    }
}


if (webSearchBtn) {

    webSearchBtn.addEventListener(
        "click",
        function () {

            performWebSearch(
                webSearchInput.value
            );

        }
    );

}


document
    .querySelectorAll(
        ".quick-question"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const question =
                        button.dataset.question;

                    webSearchInput.value =
                        question;

                    performWebSearch(
                        question
                    );

                }
            );

        }
    );


// ==================================================
// AI CHAT UI
// ==================================================

const aiChatInput =
    document.getElementById(
        "aiChatInput"
    );


const aiChatBtn =
    document.getElementById(
        "aiChatBtn"
    );


const aiChatResult =
    document.getElementById(
        "aiChatResult"
    );


async function askAI(
    question
) {

    question =
        question.trim();


    if (!question) {

        aiChatResult.innerHTML =
            "<p>Please question enter karein.</p>";

        return;
    }


    aiChatResult.innerHTML =
        "<p>🤖 AI soch raha hai...</p>";


    try {

        const response =
            await fetch(
                "/ai-chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question:
                            question
                    })
                }
            );


        const data =
            await response.json();


        if (
            data.success
        ) {

            aiChatResult.innerHTML = `

                <div class="ai-answer-card">

                    <div class="ai-answer-title">
                        🤖 AI Assistant
                    </div>

                    <p>
                        ${escapeHTML(
                            data.answer
                        )}
                    </p>

                </div>

            `;


            speak(
                data.answer.substring(
                    0,
                    450
                )
            );

        } else {

            aiChatResult.innerHTML = `

                <p>
                    ${escapeHTML(
                        data.answer
                    )}
                </p>

            `;

        }

    } catch (error) {

        console.error(
            "AI CHAT ERROR:",
            error
        );

        aiChatResult.innerHTML =
            "<p>AI service abhi available nahi hai.</p>";

    }
}


if (aiChatBtn) {

    aiChatBtn.addEventListener(
        "click",
        function () {

            askAI(
                aiChatInput.value
            );

        }
    );

}


if (aiChatInput) {

    aiChatInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                askAI(
                    aiChatInput.value
                );

            }

        }
    );

}


document
    .querySelectorAll(
        ".ai-question"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const question =
                        button.dataset.question;

                    aiChatInput.value =
                        question;

                    askAI(
                        question
                    );

                }
            );

        }
    );


// ==================================================
// COMMAND HISTORY UI
// ==================================================

const commandHistory =
    document.getElementById(
        "commandHistory"
    );


const refreshHistoryBtn =
    document.getElementById(
        "refreshHistoryBtn"
    );


const clearHistoryBtn =
    document.getElementById(
        "clearHistoryBtn"
    );


function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


async function loadCommandHistory() {

    if (!commandHistory) {
        return;
    }


    try {

        const response =
            await fetch(
                "/history"
            );


        const data =
            await response.json();


        if (
            !data.history ||
            data.history.length === 0
        ) {

            commandHistory.innerHTML =
                "<p>No command history yet.</p>";

            return;
        }


        commandHistory.innerHTML =
            data.history.map(
                item => `

                    <div class="history-item">

                        <div class="history-command">
                            👤 ${escapeHTML(
                                item.user_command
                            )}
                        </div>

                        <div class="history-answer">
                            🤖 ${escapeHTML(
                                item.assistant_response
                            )}
                        </div>

                        <div class="history-meta">

                            ${escapeHTML(
                                item.command_type || "General"
                            )}

                            •

                            ${escapeHTML(
                                item.created_at
                            )}

                        </div>

                    </div>

                `
            ).join("");

    } catch (error) {

        console.error(
            "HISTORY ERROR:",
            error
        );

        commandHistory.innerHTML =
            "<p>History load nahi ho paayi.</p>";
    }
}


if (refreshHistoryBtn) {

    refreshHistoryBtn.addEventListener(
        "click",
        loadCommandHistory
    );

}


if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "Kya aap complete command history delete karna chahte hain?"
                );


            if (!confirmed) {
                return;
            }


            try {

                await fetch(
                    "/clear-history",
                    {
                        method:
                            "DELETE"
                    }
                );


                loadCommandHistory();

            } catch (error) {

                console.error(
                    error
                );

            }

        }
    );

}


// ==================================================
// INITIALIZATION
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCommandHistory();

        updateWorldClock();

    }
);