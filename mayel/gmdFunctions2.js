const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");
const config = require("../config");
const { createContext } = require("./gmdHelpers");
const { getSetting } = require("./gmdSudoUtil");
const logger = require("prince-baileys/lib/Utils/logger").default.child({});
const { isJidGroup, downloadMediaMessage } = require("prince-baileys");

const {
    CHATBOT: chatBot,
    ANTICALL: antiCall,
    ANTICALL_MSG: antiCallMsg,
    DM_PRESENCE: dmPresence,
    GC_PRESENCE: groupPresence,
    MODE: botMode, 
    FOOTER: botFooter,
    BOT_NAME: botName,
    BOT_PIC: botPic, 
    TIME_ZONE: tZ,
    ANTIDELETE: antiDelete,
} = config;


const formatTime = (timestamp) => {
    const timeZone = tZ || 'Africa/Nairobi'; 
    const date = new Date(timestamp);
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone };
    return new Intl.DateTimeFormat('en-US', options).format(date);
};

const formatDate = (timestamp) => {
    const timeZone = tZ || 'Africa/Nairobi';
    const date = new Date(timestamp);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone };
    return new Intl.DateTimeFormat('en-GB', options).format(date); 
};

const isMediaMessage = message => {
    const typeOfMessage = getContentType(message);
    const mediaTypes = [
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'documentMessage',
        'stickerMessage'
    ];
    return mediaTypes.includes(typeOfMessage);
};


const isAnyLink = (message) => {
            const linkPattern = /https?:\/\/[^\s]+/;
            return linkPattern.test(message);
        };


const emojis = ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❤️‍', '🔥', '❤️‍', '🩹', '💯', '♨️', '💢', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🌐', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄️', '🎴', '🎭️', '🔇', '🔈️', '🔉', '🔊', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '🏧', '🚮', '🚰', '♿️', '🚹️', '🚺️', '🚻', '🚼️', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔️', '🚫', '🚳', '🚭️', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩️', '⏭️', '⏯️', '◀️', '⏪️', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️', '❓️', '❔', '❕', '❗️', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕️', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯️', '🉐', '🈹', '🈚️', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫️', '⚪️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛️', '⬜️', '◼️', '◻️', '◾️', '◽️', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '🕛️', '🕧️', '🕐️', '🕜️', '🕑️', '🕝️', '🕒️', '🕞️', '🕓️', '🕟️', '🕔️', '🕠️', '🕕️', '🕡️', '🕖️', '🕢️', '🕗️', '🕣️', '🕘️', '🕤️', '🕙️', '🕥️', '🕚️', '🕦️', '*️', '#️', '0️', '1️', '2️', '3️', '4️', '5️', '6️', '7️', '8️', '9️', '🛎️', '🧳', '⌛️', '⏳️', '⌚️', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '🗺️', '🧭', '🎃', '🎄', '🧨', '🎈', '🎉', '🎊', '🎎', '🎏', '🎐', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🔮', '🧿', '🎮️', '🕹️', '🎰', '🎲', '♟️', '🧩', '🧸', '🖼️', '🎨', '🧵', '🧶', '👓️', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓️', '🧢', '⛑️', '📿', '💄', '💍', '💎', '📢', '📣', '📯', '🎙️', '🎚️', '🎛️', '🎤', '🎧️', '📻️', '🎷', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '📱', '📲', '☎️', '📞', '📟️', '📠', '🔋', '🔌', '💻️', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿️', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬️', '📺️', '📷️', '📸', '📹️', '📼', '🔍️', '🔎', '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚️', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰️', '💴', '💵', '💶', '💷', '💸', '💳️', '🧾', '✉️', '💌', '📧', '🧧', '📨', '📩', '📤️', '📥️', '📦️', '📫️', '📪️', '📬️', '📭️', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋️', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒️', '🔓️', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💣️', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🏺', '🕳️', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠️', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭️', '🏯', '🏰', '💒', '🗼', '🗽', '⛪️', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲️', '⛺️', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '🗾', '🏞️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇️', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍️', '🚎', '🚐', '🚑️', '🚒', '🚓', '🚔️', '🚕', '🚖', '🚗', '🚘️', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲️', '🛴', '🛹', '🚏', '🛣️', '🛤️', '🛢️', '⛽️', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '⛵️', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🎆', '🎇', '🎑', '🗿', '⚽️', '⚾️', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳️', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🎖️', '🏆️', '🏅', '🥇', '🥈', '🥉', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕️', '🍵', '🍶', '🍾', '🍷', '🍸️', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🐵', '🐒', '🦍', '🦧', '🐶', '🐕️', '🦮', '🐕‍', '🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈️', '🐈‍', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐻‍', '❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦️', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟️', '🐠', '🐡', '🦈', '🐙', '🦑', '🦀', '🦞', '🦐', '🦪', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🎋', '🎍', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍️', '🌎️', '🌏️', '🌑', '🌒', '🌓', '🌔', '🌕️', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜️', '☀️', '🌝', '🌞', '🪐', '💫', '⭐️', '🌟', '✨', '🌠', '🌌', '☁️', '⛅️', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔️', '⛱️', '⚡️', '❄️', '☃️', '⛄️', '☄️', '🔥', '💧', '🌊', '💥', '💦', '💨', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐️', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '😮‍', '💨', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍', '🌫️', '🥴', '😵‍', '💫', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽️', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈️', '👉️', '👆️', '🖕', '👇️', '☝️', '👍️', '👎️', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂️', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '🧔‍♀️', '🧔‍♂️', '🧑', '👨‍', '🦰', '👩‍', '🦰', '🧑', '👨‍', '🦱', '👩‍', '🦱', '🧑', '👨‍', '🦳', '👩‍', '🦳', '🧑', '👨‍', '🦲', '👩‍', '🦲', '👱', '👱‍♂️', '👱‍♀️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🤱', '👩‍', '🍼', '👨‍', '🍼', '🧑‍', '🍼', '👼', '🎅', '🤶', '🧑‍', '🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍', '🦯', '👨‍', '🦯', '👩‍', '🦯', '🧑‍', '🦼', '👨‍', '🦼', '👩‍', '🦼', '🧑‍', '🦽', '👨‍', '🦽', '👩‍', '🦽', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '??‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂️', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄️', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊️', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌', '🧑‍', '🤝‍', '🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪️', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '👣'];
const PrinceApiKey = 'prince_api_56yjJ568dte4';
const PrinceTechApi = 'https://api.princetechn.com';
async function PrinceAutoReact(emoji, ms,Prince) {
  try {
    const react = {
      react: {
        text: emoji,
        key: ms.key,
      },
    };

    await Prince.sendMessage(ms.key.remoteJid, react);
  } catch (error) {
    console.error('Error sending auto reaction:', error);
  }
}


const PrinceAntiLink = async (Prince, message, antiLink) => {
    try {
        if (!message?.message || message.key.fromMe) return;
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup || antiLink === 'false') return;

        const groupMetadata = await Prince.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const groupAdmins = participants
            .filter((member) => member.admin)
            .map((admin) => admin.id);

        if (groupAdmins.includes(sender)) return;

        const messageType = getContentType(message.message);
        const body = messageType === 'conversation'
            ? message.message.conversation
            : message.message[messageType]?.text || 
              message.message[messageType]?.caption || '';

        if (!body || !isAnyLink(body)) return;

        // Delete the message
        await Prince.sendMessage(from, { delete: message.key });

        if (antiLink === 'kick') {
            await Prince.groupParticipantsUpdate(from, [sender], 'remove');
            await Prince.sendMessage(
                from,
                {
                    text: `⚠️ ${botName || 'Prince Md'} anti-link active!\nUser @${sender.split('@')[0]} has been kicked for sharing a link.`,
                    mentions: [sender],
                }
            );
        } else if (antiLink === 'delete') {
            await Prince.sendMessage(
                from,
                {
                    text: `⚠️ ${botName || 'Prince Md'} anti-link active!\nLinks are not allowed here @${sender.split('@')[0]}!`,
                    mentions: [sender],
                }
            );
        } else if (antiLink === 'warn') {
            const warnings = await addWarning(from, sender, "Sending links is not allowed!");
            if (warnings >= 3) {
                await Prince.groupParticipantsUpdate(from, [sender], 'remove');
                await Prince.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} has been kicked for reaching 3 warnings (Anti-Link).`, 
                    mentions: [sender] 
                });
                await resetWarnings(from, sender);
            } else {
                await Prince.sendMessage(
                    from,
                    {
                        text: `⚠️ Warning @${sender.split('@')[0]}!\nLinks are not allowed in this group! Warning: ${warnings}/3`,
                        mentions: [sender],
                    }
                );
            }
        }
    } catch (err) {
        console.error('Anti-link error:', err);
    }
};

const PrinceStatusMention = async (Prince, message, mode) => {
    try {
        if (!message?.message || message.key.fromMe) return;
        const from = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup || mode === 'false') return;

        const groupMetadata = await Prince.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const groupAdmins = participants
            .filter((member) => member.admin)
            .map((admin) => admin.id);

        if (groupAdmins.includes(sender)) return;
        
        // Delete the message
        await Prince.sendMessage(from, { delete: message.key });

        if (mode === 'kick') {
            await Prince.groupParticipantsUpdate(from, [sender], 'remove');
            await Prince.sendMessage(
                from,
                {
                    text: `⚠️ ${botName || 'Prince Md'} status-mention active!\nUser @${sender.split('@')[0]} has been kicked for tagging everyone.`,
                    mentions: [sender],
                }
            );
        } else if (mode === 'delete') {
            await Prince.sendMessage(
                from,
                {
                    text: `⚠️ ${botName || 'Prince Md'} status-mention active!\nTagging everyone is not allowed here @${sender.split('@')[0]}!`,
                    mentions: [sender],
                }
            );
        } else if (mode === 'warn') {
            const warnings = await addWarning(from, sender, "Tagging everyone is not allowed!");
            if (warnings >= 3) {
                await Prince.groupParticipantsUpdate(from, [sender], 'remove');
                await Prince.sendMessage(from, { 
                    text: `🚫 @${sender.split('@')[0]} has been kicked for reaching 3 warnings (Status Mention).`, 
                    mentions: [sender] 
                });
                await resetWarnings(from, sender);
            } else {
                await Prince.sendMessage(
                    from,
                    {
                        text: `⚠️ Warning @${sender.split('@')[0]}!\nTagging everyone is not allowed in this group! Warning: ${warnings}/3`,
                        mentions: [sender],
                    }
                );
            }
        }
    } catch (err) {
        console.error('Status mention action error:', err);
    }
};

module.exports = {
    logger,
    emojis,
    PrinceAutoReact,
    PrinceTechApi,
    PrinceApiKey,
    PrinceAntiLink,
    PrinceStatusMention,
    PrinceAutoBio,
    PrinceChatBot,
    PrincePresence,
    PrinceAntiDelete,
    PrinceAnticall,
};


function getTimeBlock() {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 11) return "morning";
            if (hour >= 11 && hour < 16) return "afternoon";
            if (hour >= 16 && hour < 21) return "evening";
            if (hour >= 21 || hour < 2) return "night";
            return "latenight";
        }

        const quotes = {
            morning: [ "☀️ ʀɪsᴇ ᴀɴᴅ sʜɪɴᴇ. ɢʀᴇᴀᴛ ᴛʜɪɴɢs ɴᴇᴠᴇʀ ᴄᴀᴍᴇ ғʀᴏᴍ ᴄᴏᴍғᴏʀᴛ ᴢᴏɴᴇs.", "🌅 ᴇᴀᴄʜ �ᴍᴏʀɴɪɴɢ ᴡᴇ ᴀʀᴇ ʙᴏʀɴ ᴀɢᴀɪɴ. ᴡʜᴀᴛ ᴡᴇ ᴅᴏ ᴛᴏᴅᴀʏ ɪs ᴡʜᴀᴛ ᴍᴀᴛᴛᴇʀs �ᴍᴏsᴛ.", "⚡ sᴛᴀʀᴛ ʏᴏᴜʀ ᴅᴀʏ ᴡɪᴛʜ ᴅᴇᴛᴇʀᴍɪɴᴀᴛɪᴏɴ, ᴇɴᴅ ɪᴛ ᴡɪᴛʜ sᴀᴛɪsғᴀᴄᴛɪᴏɴ.", "🌞 ᴛʜᴇ sᴜɴ ɪs ᴜᴘ, ᴛʜᴇ ᴅᴀʏ ɪs ʏᴏᴜʀs.", "📖 ᴇᴠᴇʀʏ ᴍᴏʀɴɪɴɢ ɪs ᴀ ɴᴇᴡ ᴘᴀɢᴇ ᴏғ ʏᴏᴜʀ sᴛᴏʀʏ. ᴍᴀᴋᴇ ɪᴛ ᴄᴏᴜɴᴛ." ], 
            afternoon: [ "⏳ ᴋᴇᴇᴘ ɢᴏɪɴɢ. ʏᴏᴜ'ʀᴇ ʜᴀʟғᴡᴀʏ ᴛᴏ ɢʀᴇᴀᴛɴᴇss.", "🔄 sᴛᴀʏ ғᴏᴄᴜsᴇᴅ. ᴛʜᴇ ɢʀɪɴᴅ ᴅᴏᴇsɴ'ᴛ sᴛᴏᴘ ᴀᴛ ɴᴏᴏɴ.", "🏗️ sᴜᴄᴄᴇss ɪs ʙᴜɪʟᴛ ɪɴ ᴛʜᴇ ʜᴏᴜʀs ɴᴏʙᴏᴅʏ ᴛᴀʟᴋs ᴀʙᴏᴜᴛ.", "🔥 ᴘᴜsʜ ᴛʜʀᴏᴜɢʜ. ᴄʜᴀᴍᴘɪᴏɴs ᴀʀᴇ ᴍᴀᴅᴇ ɪɴ ᴛʜᴇ ᴍɪᴅᴅʟᴇ ᴏғ ᴛʜᴇ ᴅᴀʏ.", "⏰ ᴅᴏɴ'ᴛ ᴡᴀᴛᴄʜ ᴛʜᴇ ᴄʟᴏᴄᴋ, ᴅᴏ ᴡʜᴀᴛ ɪᴛ ᴅᴏᴇs—ᴋᴇᴇᴘ ɢᴏɪɴɢ." ],
            evening: [ "🛌 ʀᴇsᴛ ɪs ᴘᴀʀᴛ ᴏғ ᴛʜᴇ ᴘʀᴏᴄᴇss. ʀᴇᴄʜᴀʀɢᴇ ᴡɪsᴇʟʏ.", "🌇 ᴇᴠᴇɴɪɴɢ ʙʀɪɴɢꜱ ꜱɪʟᴇɴᴄᴇ ᴛʜᴀᴛ ꜱᴘᴇᴀᴋꜱ ʟᴏᴜᴅᴇʀ ᴛʜᴀɴ ᴅᴀʏʟɪɢʜᴛ.", "✨ ʏᴏᴜ ᴅɪᴅ ᴡᴇʟʟ ᴛᴏᴅᴀʏ. ᴘʀᴇᴘᴀʀᴇ ғᴏʀ ᴀɴ ᴇᴠᴇɴ ʙᴇᴛᴛᴇʀ �ᴛᴏᴍᴏʀʀᴏᴡ.", "🌙 ʟᴇᴛ ᴛʜᴇ ɴɪɢʜᴛ sᴇᴛᴛʟᴇ ɪɴ, ʙᴜᴛ ᴋᴇᴇᴘ ʏᴏᴜʀ ᴅʀᴇᴀᴍs ᴡɪᴅᴇ ᴀᴡᴀᴋᴇ.", "🧠 ɢʀᴏᴡᴛʜ ᴅᴏᴇsɴ'ᴛ ᴇɴᴅ ᴀᴛ sᴜɴsᴇᴛ. ɪᴛ sʟᴇᴇᴘs ᴡɪᴛʜ ʏᴏᴜ." ],
            night: [ "🌌 ᴛʜᴇ ɴɪɢʜᴛ ɪs sɪʟᴇɴᴛ, ʙᴜᴛ ʏᴏᴜʀ ᴅʀᴇᴀᴍs ᴀʀᴇ ʟᴏᴜᴅ.", "⭐ sᴛᴀʀs sʜɪɴᴇ ʙʀɪɢʜᴛᴇsᴛ ɪɴ ᴛʜᴇ ᴅᴀʀᴋ. sᴏ ᴄᴀɴ ʏᴏᴜ.", "🧘‍♂️ ʟᴇᴛ ɢᴏ ᴏғ ᴛʜᴇ ɴᴏɪsᴇ. ᴇᴍʙʀᴀᴄᴇ ᴛʜᴇ ᴘᴇᴀᴄᴇ.", "✅ ʏᴏᴜ ᴍᴀᴅᴇ ɪᴛ ᴛʜʀᴏᴜɢʜ ᴛʜᴇ ᴅᴀʏ. ɴᴏᴡ ᴅʀᴇᴀᴍ ʙɪɢ.", "🌠 ᴍɪᴅɴɪɢʜᴛ ᴛʜᴏᴜɢʜᴛs ᴀʀᴇ ᴛʜᴇ ʙʟᴜᴇᴘʀɪɴᴛ ᴏғ ᴛᴏᴍᴏʀʀᴏᴡ's ɢʀᴇᴀᴛɴᴇss." ],
            latenight: [ "🕶️ ᴡʜɪʟᴇ ᴛʜᴇ ᴡᴏʀʟᴅ sʟᴇᴇᴘs, ᴛʜᴇ ᴍɪɴᴅs ᴏғ ʟᴇɢᴇɴᴅs ᴡᴀɴᴅᴇʀ.", "⏱️ ʟᴀᴛᴇ ɴɪɢʜᴛs ᴛᴇᴀᴄʜ ᴛʜᴇ ᴅᴇᴇᴘᴇsᴛ ʟᴇssᴏɴs.", "🔕 sɪʟᴇɴᴄᴇ ɪsɴ'ᴛ ᴇᴍᴘᴛʏ—ɪᴛ's ғᴜʟʟ ᴏғ ᴀɴsᴡᴇʀs.", "✨ ᴄʀᴇᴀᴛɪᴠɪᴛʏ ᴡʜɪsᴘᴇʀs ᴡʜᴇɴ �ᴛʜᴇ ᴡᴏʀʟᴅ ɪs ǫᴜɪᴇᴛ.", "🌌 ʀᴇsᴛ ᴏʀ ʀᴇғʟᴇᴄᴛ, ʙᴜᴛ ɴᴇᴠᴇʀ ᴡᴀsᴛᴇ ᴛʜᴇ ɴɪɢʜᴛ." ] 
        };

        function getCurrentDateTime() {
            return new Intl.DateTimeFormat("en", {
                year: "numeric",
                month: "long",
                day: "2-digit"
            }).format(new Date());
        }

const PrinceAutoBio = async (Prince) => {
                try {
                    const block = getTimeBlock();
                    const timeDate = getCurrentDateTime();
                    const timeQuotes = quotes[block];
                    const quote = timeQuotes[Math.floor(Math.random() * timeQuotes.length)];

                    const bioText = `${botName} Online ||\n\n📅 ${timeDate}\n\n➤ ${quote}`;

                    await Prince.updateProfileStatus(bioText);
                } catch (error) {
                }
            };


const availableApis = [
    `${PrinceTechApi}/api/ai/ai?apikey=${PrinceApiKey}&q=`,
    `${PrinceTechApi}/api/ai/mistral?apikey=${PrinceApiKey}&q=`
];

function getRandomApi() {
    return availableApis[Math.floor(Math.random() * availableApis.length)];
}

function processForTTS(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[\[\]\(\)\{\}]/g, ' ')
              .replace(/\s+/g, ' ')
              .substring(0, 190);
}

const identityPatterns = [
                /who\s*(made|created|built)\s*you/i,
                /who\s*is\s*your\s*(creator|developer|maker|owner|father|parent)/i,
                /what('?s| is)\s*your\s*name\??/i,
                /who\s*are\s*you\??/i,
                /who\s*a?you\??/i,
                /who\s*au\??/i,
                /what('?s| is)\s*ur\s*name\??/i,
                /wat('?s| is)\s*(ur|your)\s*name\??/i,
                /wats?\s*(ur|your)\s*name\??/i,
                /wot('?s| is)\s*(ur|your)\s*name\??/i,
                /hoo\s*r\s*u\??/i,
                /who\s*u\??/i,
                /whos\s*u\??/i,
                /whos?\s*this\??/i,
                /you\s*called\s*prince/i,
                /are\s*you\s*prince/i,
                /are\s*u\s*prince/i,
                /u\s*prince\??/i,
                /who\s*is\s*your\s*boss\??/i,
                /who\s*ur\s*boss\??/i,
                /who\s*your\s*boss\??/i,
                /whoa\s*created\s*you\??/i,
                /who\s*made\s*u\??/i,
                /who\s*create\s*u\??/i,
                /who\s*built\s*u\??/i,
                /who\s*ur\s*owner\??/i,
                /who\s*is\s*u\??/i,
                /what\s*are\s*you\??/i,
                /what\s*r\s*u\??/i,
                /wat\s*r\s*u\??/i
            ];

function isIdentityQuestion(query) {
    return identityPatterns.some(pattern => 
        typeof query === 'string' && pattern.test(query)
    );
}

async function getAIResponse(query) {
    if (isIdentityQuestion(query)) {
        return 'I am an Interactive Ai Assistant Chat Bot, created by Prince Tech!';
    }
    
    try {
        const apiUrl = getRandomApi();
        const response = await fetch(apiUrl + encodeURIComponent(query));
        const textBody = await response.text();
        
        try {
            const data = JSON.parse(textBody);
            let aiResponse = data.result || data.response || data.message || 
                           (data.data && (data.data.text || data.data.message)) || 
                           JSON.stringify(data);
            
            if (typeof aiResponse === 'object') {
                aiResponse = JSON.stringify(aiResponse);
            }

            return aiResponse;
        } catch (jsonError) {
            return textBody || "Sorry, I couldn't get a response right now";
        }
    } catch (error) {
        console.error("API Error:", error);
        return "Sorry, I couldn't get a response right now";
    }
}

const chatBotCooldowns = new Map();
const CHATBOT_COOLDOWN_MS = 3000;

function PrinceChatBot(Prince, chatBot, chatBotMode, createContext, createContext2, googleTTS) {
    Prince.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg?.message || msg.key.fromMe) return;

            const currentChatBot = getSetting('CHATBOT', chatBot);
            if (currentChatBot !== 'true' && currentChatBot !== 'audio') return;

            const jid = msg.key.remoteJid;
            if (!jid || jid === 'status@broadcast' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) return;

            const isGroup = jid.endsWith('@g.us');
            const currentChatBotMode = getSetting('CHATBOT_MODE', chatBotMode);

            if (currentChatBotMode === 'groups' && !isGroup) return;
            if (currentChatBotMode === 'inbox' && isGroup) return;

            if (isGroup) {
                const botNumber = Prince.user?.id?.split(':')[0];
                const botId = botNumber + '@s.whatsapp.net';
                const botLid = Prince.user?.lid;
                const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || '';
                const isBotMentioned = mentionedJids.some(m => {
                    if (!m) return false;
                    const mNum = m.split('@')[0].split(':')[0];
                    return mNum === botNumber;
                });
                const isQuotedFromBot = quotedParticipant.split('@')[0].split(':')[0] === botNumber ||
                                        (botLid && quotedParticipant === botLid);

                if (!isBotMentioned && !isQuotedFromBot) return;
            }

            const now = Date.now();
            const lastTime = chatBotCooldowns.get(jid) || 0;
            if (now - lastTime < CHATBOT_COOLDOWN_MS) return;
            chatBotCooldowns.set(jid, now);

            const msgType = Object.keys(msg.message)[0];
            if (['protocolMessage', 'reactionMessage', 'senderKeyDistributionMessage', 'messageContextInfo'].includes(msgType)) return;

            let text = '';

            if (msg.message.conversation) {
                text = msg.message.conversation;
            } else if (msg.message.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text;
            } else if (msg.message.imageMessage?.caption) {
                text = msg.message.imageMessage.caption;
            }

            if (!text || typeof text !== 'string' || text.length < 2) return;

            text = text.replace(/@\d+/g, '').trim();
            if (!text) return;

            const activePrefix = getSetting('PREFIX', '.');
            if (text.startsWith(activePrefix)) return;

            const currentBotName = getSetting('BOT_NAME', botName);

            await new Promise(resolve => setTimeout(resolve, 1500));

            const aiResponse = await getAIResponse(text);
            if (!aiResponse || aiResponse === "Sorry, I couldn't get a response right now") return;

            if (currentChatBot === "true") {
                await Prince.sendMessage(jid, { 
                    text: String(aiResponse),
                    ...createContext(jid, {
                        title: `${currentBotName} 𝐂𝐇𝐀𝐓 𝐁𝐎𝐓`,
                        body: '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐆𝐢𝐟𝐭𝐞𝐝 𝐀𝐩𝐢'
                    })
                }, { quoted: msg });
            }

            if (currentChatBot === 'audio') {
                const ttsText = processForTTS(String(aiResponse));
                if (ttsText) {
                    const audioUrl = googleTTS.getAudioUrl(ttsText, {
                        lang: "en",
                        slow: false,
                        host: "https://translate.google.com",
                    });

                    await Prince.sendMessage(jid, {
                        audio: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        ptt: true,
                        waveform: [1000, 0, 1000, 0, 1000, 0, 1000],
                        ...createContext2(jid, {
                           title: `${currentBotName} 𝐀𝐔𝐃𝐈𝐎-𝐂𝐇𝐀𝐓 𝐁𝐎𝐓`,
                           body: '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐆𝐢𝐟𝐭𝐞𝐝 𝐀𝐩𝐢𝐬'
                        })
                    }, { quoted: msg });
                }
            }
        } catch (error) {
            if (error?.data === 429 || error?.message?.includes('rate-overlimit')) {
                console.log("Chatbot rate limited, waiting...");
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.error("Message processing error:", error);
            }
        }
    });
}


const presenceTimers = new Map();

const PrincePresence = async (Prince, jid) => {
    try {
        const isGroup = jid.endsWith('@g.us');
        const duration = 15 * 60 * 1000; // minutes duration

        if (presenceTimers.has(jid)) {
            clearTimeout(presenceTimers.get(jid));
            presenceTimers.delete(jid);
        }

        const presenceType = isGroup ? groupPresence : dmPresence;
        if (!presenceType) return;

        const presence = presenceType.toLowerCase();
        let whatsappPresence;

        switch(presence) {
            case 'online':
                whatsappPresence = "available";
                break;
            case 'typing':
                whatsappPresence = "composing";
                break;
            case 'recording':
                whatsappPresence = "recording";
                break;
            case 'offline':
                whatsappPresence = "unavailable";
                break;
            default:
                logger.warn(`Invalid ${isGroup ? 'group' : ''}presence: ${presenceType}`);
                return;
        }

        await Prince.sendPresenceUpdate(whatsappPresence, jid);
        logger.debug(`${isGroup ? 'Group' : 'Chat'} presence activated: ${presence} for ${jid}`);
        presenceTimers.set(jid, setTimeout(() => {
            presenceTimers.delete(jid);
            logger.debug(`${isGroup ? 'Group' : 'Chat'} presence duration ended for ${jid}`);
        }, duration));

    } catch (e) {
        logger.error('Presence update failed:', e.message);
    }
};


const PrinceAnticall = async (json, Prince) => {
   for (const id of json) {
      if (id.status === 'offer') {
         if (antiCall === "true" || antiCall === "decline") {
            let msg = await Prince.sendMessage(id.from, {
               text: `${antiCallMsg}`,
               mentions: [id.from],
            });
            await Prince.rejectCall(id.id, id.from);
         } else if (antiCall === "block") {
            let msg = await Prince.sendMessage(id.from, {
               text: `${antiCallMsg}\nYou are Being Blocked due to Calling While Anticall Action Is *"Block"*!`,
               mentions: [id.from],
            });
            await Prince.rejectCall(id.id, id.from); 
            await Prince.updateBlockStatus(id.from, "block");
         }
      }
   }
};


const processMediaMessage = async (deletedMessage) => {
    let mediaType, mediaInfo;
    
    const mediaTypes = {
        imageMessage: 'image',
        videoMessage: 'video',
        audioMessage: 'audio',
        stickerMessage: 'sticker',
        documentMessage: 'document'
    };

    for (const [key, type] of Object.entries(mediaTypes)) {
        if (deletedMessage.message?.[key]) {
            mediaType = type;
            mediaInfo = deletedMessage.message[key];
            break;
        }
    }

    if (!mediaType || !mediaInfo) return null;

    try {
        const mediaStream = await downloadMediaMessage(deletedMessage, { logger });
        
        const extensions = {
            image: 'jpg',
            video: 'mp4',
            audio: mediaInfo.mimetype?.includes('mpeg') ? 'mp3' : 'ogg',
            sticker: 'webp',
            document: mediaInfo.fileName?.split('.').pop() || 'bin'
        };
        
        const tempPath = path.join(__dirname, `./temp/temp_${Date.now()}.${extensions[mediaType]}`);
        await fs.ensureDir(path.dirname(tempPath));
        await pipeline(mediaStream, fs.createWriteStream(tempPath));
        
        return {
            path: tempPath,
            type: mediaType,
            caption: mediaInfo.caption || '',
            mimetype: mediaInfo.mimetype,
            fileName: mediaInfo.fileName || `${mediaType}_${Date.now()}.${extensions[mediaType]}`,
            ptt: mediaInfo.ptt
        };
    } catch (error) {
        logger.error(`Media processing failed:`, error);
        return null;
    }
};

const PrinceAntiDelete = async (Prince, deletedMsg, key, deleter, sender, botOwnerJid, deleterPushName, senderPushName) => {
    const adMode = getSetting('ANTIDELETE', antiDelete || 'off').toLowerCase();
    if (!adMode || adMode === 'false' || adMode === 'off') return;

    const isGroup = isJidGroup(key.remoteJid);

    if (adMode === 'chat' && isGroup) return;
    if (adMode === 'group' && !isGroup) return;

    const context = createContext(deleter, {
        title: "Anti-Delete",
        body: botName,
        thumbnail: botPic
    });
    
    const currentTime = formatTime(Date.now());
    const currentDate = formatDate(Date.now());

    const displayDeleter = deleter.endsWith('@s.whatsapp.net') ? 
        (`@${deleter.split('@')[0]}` || `@${deleterPushName}`) : 
        deleter;

    const displaySender = sender.endsWith('@s.whatsapp.net') ? 
        (`@${sender.split('@')[0]}` || `@${senderPushName}`) : 
        sender;

    let chatInfo;
    if (isGroup) {
        try {
            chatInfo = `💬 Group Chat: ${(await Prince.groupMetadata(key.remoteJid)).subject}`;
        } catch (error) {
            logger.error('Failed to fetch group metadata:', error);
            chatInfo = `💬 Group Chat`;
        }
    } else {
        chatInfo = `💬 Dm Chat: ${key.pushName || `@${deleter.split('@')[0]}`}`;
    }

    const sendDeletedToOwner = async () => {
        try {
            const ownerContext = `*👤 Sent By*: ${displaySender}\n*👤 Deleted By:* ${displayDeleter}\n${chatInfo}`;

            if (deletedMsg.message?.conversation || deletedMsg.message?.extendedTextMessage?.text) {
                const text = deletedMsg.message.conversation || 
                            deletedMsg.message.extendedTextMessage.text;
                
                await Prince.sendMessage(botOwnerJid, { 
                    text: `*𝙰𝙽𝚃𝙸𝙳𝙴𝙻𝙴𝚃𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝚂𝚈𝚂𝚃𝙴𝙼*\n\n*🕑 Time:* ${currentTime}\n*📆 Date:* ${currentDate}\n\n${ownerContext}\n\n*Deleted Msg:*\n${text}\n\n> *${botFooter}*`,
                    ...context
                });
            } else {
                const media = await processMediaMessage(deletedMsg);
                if (media) {
                    await Prince.sendMessage(botOwnerJid, {
                        [media.type]: { url: media.path },
                        caption: media.caption ? 
                            `*𝙰𝙽𝚃𝙸𝙳𝙴𝙻𝙴𝚃𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝚂𝚈𝚂𝚃𝙴𝙼*\n\n*🕑 Time:* ${currentTime}\n*📆 Date:* ${currentDate}\n\n${ownerContext}\n\n*Caption:*\n${media.caption}\n\n> *${botFooter}*` : 
                            `*𝙰𝙽𝚃𝙸𝙳𝙴𝙻𝙴𝚃𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝚂𝚈𝚂𝚃𝙴𝙼*\n\n*🕑 Time:* ${currentTime}\n*📆 Date:* ${currentDate}\n\n${ownerContext}\n\n> *${botFooter}*`,
                        ...context,
                        ...(media.type === 'document' ? {
                            mimetype: media.mimetype,
                            fileName: media.fileName
                        } : {}),
                        ...(media.type === 'audio' ? {
                            ptt: media.ptt,
                            mimetype: media.mimetype
                        } : {})
                    });

                    setTimeout(() => {
                        fs.unlink(media.path).catch(err => 
                            logger.error('Media cleanup failed:', err)
                        );
                    }, 30000);
                }
            }
        } catch (error) {
            logger.error('Failed to forward ANTIDELETE to owner:', error);
            await Prince.sendMessage(botOwnerJid, {
                text: `⚠️ Failed to forward deleted message from ${displayDeleter}\n\nError: ${error.message}`,
                ...context
            });
        }
    };

    const sendDeletedInChat = async () => {
        try {
            const baseAlert = `*𝙰𝙽𝚃𝙸𝙳𝙴𝙻𝙴𝚃𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝚂𝚈𝚂𝚃𝙴𝙼*\n\n` +
                            `*👤 Sent By*: ${displaySender}\n` +
                            `*👤 Deleted By*: ${displayDeleter}\n` +
                            `*🕑 Time:* ${currentTime}\n` + 
                            `*📆 Date:* ${currentDate}\n` +
                            `${chatInfo}\n\n> *${botFooter}*`;

            if (deletedMsg.message?.conversation || deletedMsg.message?.extendedTextMessage?.text) {
                const text = deletedMsg.message.conversation || 
                            deletedMsg.message.extendedTextMessage.text;
                
                await Prince.sendMessage(key.remoteJid, {
                    text: `${baseAlert}\n\n📝 *Content:* ${text}`,
                    mentions: [deleter],
                    ...context
                });
            } else {
                const media = await processMediaMessage(deletedMsg);
                if (media) {
                    await Prince.sendMessage(key.remoteJid, {
                        [media.type]: { url: media.path },
                        caption: media.caption ? 
                            `${baseAlert}\n\n📌 *Caption:* ${media.caption}` : 
                            baseAlert,
                        mentions: [deleter],
                        ...context,
                        ...(media.type === 'document' ? {
                            mimetype: media.mimetype,
                            fileName: media.fileName
                        } : {}),
                        ...(media.type === 'audio' ? {
                            ptt: media.ptt,
                            mimetype: media.mimetype
                        } : {})
                    });

                    setTimeout(() => {
                        fs.unlink(media.path).catch(err => 
                            logger.error('Media cleanup failed:', err)
                        );
                    }, 30000);
                }
            }
        } catch (error) {
            logger.error('Failed to process in-chat ANTIDELETE:', error);
        }
    };

    try {
        if (adMode === 'inchat') {
            await sendDeletedInChat();
        } else {
            await sendDeletedToOwner();
        }
    } catch (error) {
        logger.error('Anti-delete handling failed:', error);
    }
};

module.exports = { logger, emojis, PrinceAutoReact, PrinceTechApi, PrinceApiKey, PrinceAntiLink, PrinceAutoBio, PrinceChatBot, PrinceAntiDelete, PrinceAnticall, PrincePresence };
