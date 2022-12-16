let isWebAccessOn = true;
let isProcessing = false;
var numWebResults = 1;
var timePeriod = "";
var region = "";

chrome.storage.sync.get(["num_web_results", "web_access", "region"], (data) => {
    numWebResults = data.num_web_results;
    isWebAccessOn = data.web_access;
    region = data.region || "wt-wt";
});


window.addEventListener("load", function () {

    try {
        setTitleAndDescription();
    } catch (e) { console.log(e); }
});

function setTitleAndDescription() {
    title = document.evaluate("//h1[text()='ChatGPT']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // console.log(title);
    if (title) {
        title.textContent = "ChatGPT Advanced";
    }

    const div = document.createElement("div");
    div.classList.add("w-full", "bg-gray-50", "dark:bg-white/5", "p-6", "rounded-md", "mb-16", "border");
    div.textContent = "有了ChatGPT Advanced，您可以用相关的网络搜索结果来增强您的提示，以获得更好的、最新的答案。";
    title.parentNode.insertBefore(div, title.nextSibling);

}

var textarea = document.querySelector("textarea");
var textareaWrapper = textarea.parentNode;

var btnSubmit = textareaWrapper.querySelector("button");

textarea.addEventListener("keydown", onSubmit);

btnSubmit.addEventListener("click", onSubmit);

function showErrorMessage(e) {
    console.log(e);
    var errorDiv = document.createElement("div");
    errorDiv.classList.add("chatgpt-adv-error", "absolute", "bottom-0", "right-1", "text-white", "bg-red-500", "p-4", "rounded-lg", "mb-4", "mr-4", "text-sm");
    errorDiv.innerHTML = "<b>有错误发生</b><br>" + e + "<br><br>请检查控制台了解详情。";
    document.body.appendChild(errorDiv);
    setTimeout(() => { errorDiv.remove(); }, 5000);
}

function onSubmit(event) {
    if (event.shiftKey && event.key === 'Enter') {
        return;
    }

    if ((event.type === "click" || event.key === 'Enter') && isWebAccessOn && !isProcessing) {

        isProcessing = true;

        try {

            // showCommandsList(false);

            let query = textarea.value;
            textarea.value = "";

            query = query.trim();

            if (query === "") {
                isProcessing = false;
                return;
            }

            // console.log("timePeriod: ", timePeriod);
            let url = `https://ddg-webapp-aagd.vercel.app/search?max_results=${numWebResults}&q=${query}`;
            if (timePeriod !== "") {
                url += `&time=${timePeriod}`;
            }
            if (region !== "") {
                url += `&region=${region}`;
            }

            fetch(url)
                .then(response => response.json())
                .then(results => {
                    let counter = 1;
                    let formattedResults = "网络搜索结果: \n\n";
                    formattedResults = formattedResults + results.reduce((acc, result) => acc += `[${counter++}] "${result.body}"\n来源: ${result.href}\n\n`, "");

                    formattedResults = formattedResults + `\n当前日期: ${new Date().toLocaleDateString()}`;
                    formattedResults = formattedResults + `\n说明: 使用所提供的网络搜索结果，对给定的提示词写一个全面的答复。 确保在参考文献后使用 [[number](URL)] 的符号来引用结果。 如果所提供的搜索结果涉及到具有相同名称的多个主题，请为每个主题分别写出单独的答案。\n提示词:  ${query}`;

                    textarea.value = formattedResults;

                    // simulate pressing enter on the textarea
                    textarea.focus();
                    const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' });
                    textarea.dispatchEvent(enterEvent);

                    isProcessing = false;
                });
        } catch (error) {
            isProcessing = false;
            showErrorMessage(error);
        }
    }
}


var toolbarDiv = document.createElement("div");
toolbarDiv.classList.add("chatgpt-adv-toolbar", "gap-3");
toolbarDiv.style.padding = "0em 0.5em 0em 0.5em";


// Web access switch
var toggleWebAccessDiv = document.createElement("div");
toggleWebAccessDiv.innerHTML = '<label class="chatgpt-adv-toggle"><input class="chatgpt-adv-toggle-checkbox" type="checkbox"><div class="chatgpt-adv-toggle-switch"></div><span class="chatgpt-adv-toggle-label">在网络上查询</span></label>';
toggleWebAccessDiv.classList.add("chatgpt-adv-toggle-web-access");
chrome.storage.sync.get("web_access", (data) => {
    toggleWebAccessDiv.querySelector(".chatgpt-adv-toggle-checkbox").checked = data.web_access;
});
toolbarDiv.appendChild(toggleWebAccessDiv);


var checkbox = toggleWebAccessDiv.querySelector(".chatgpt-adv-toggle-checkbox");
checkbox.addEventListener("click", function () {
    isWebAccessOn = checkbox.checked;
    chrome.storage.sync.set({ "web_access": checkbox.checked });
});

textareaWrapper.parentNode.insertBefore(toolbarDiv, textareaWrapper);

var divider = document.createElement("hr");

var optionsDiv = document.createElement("div");
optionsDiv.classList.add("p-4", "space-y-2");

var title = document.createElement("h4");
title.innerHTML = "Advanced 选项";
title.classList.add("pb-4", "text-lg", "font-bold");

var divNumResultsSlider = document.createElement("div");
divNumResultsSlider.classList.add("flex", "justify-between");

var label = document.createElement("label");
label.innerHTML = "搜索结果";

var value = document.createElement("span");
chrome.storage.sync.get("num_web_results", (data) => {
    value.innerHTML = data.num_web_results;
});
label.appendChild(value);

divNumResultsSlider.appendChild(label);
divNumResultsSlider.appendChild(value);

var numResultsSlider = document.createElement("input");
numResultsSlider.type = "range";
numResultsSlider.min = 1;
numResultsSlider.max = 10;
numResultsSlider.step = 1;
chrome.storage.sync.get("num_web_results", (data) => {
    numResultsSlider.value = data.num_web_results;
});
numResultsSlider.classList.add("w-full");

numResultsSlider.oninput = function () {
    numWebResults = this.value;
    value.innerHTML = numWebResults;
    chrome.storage.sync.set({ "num_web_results": this.value });
};

var timePeriodLabel = document.createElement("label");
timePeriodLabel.innerHTML = "结果来自：";

var timePeriodDropdown = document.createElement("select");
timePeriodDropdown.classList.add("ml-0", "bg-gray-900", "border", "w-full");

var timePeriodOptions = [
    { value: "", label: "任何时间" },
    { value: "d", label: "过去一天" },
    { value: "w", label: "过去一周" },
    { value: "m", label: "过去一月" },
    { value: "y", label: "过去一年" }
];

timePeriodOptions.forEach(function (option) {
    var optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.innerHTML = option.label;
    timePeriodDropdown.appendChild(optionElement);
});

timePeriodDropdown.onchange = function () {
    chrome.storage.sync.set({ "time_period": this.value });
    timePeriod = this.value;
};


var regionDropdown = document.createElement("select");
regionDropdown.classList.add("ml-0", "bg-gray-900", "border", "w-full");

fetch(chrome.runtime.getURL('regions.json'))
    .then(function (response) {
        return response.json();
    })
    .then(function (regions) {
        regions.forEach(function (region) {
            var optionElement = document.createElement("option");
            optionElement.value = region.value;
            optionElement.innerHTML = region.label;
            regionDropdown.appendChild(optionElement);
        });

        regionDropdown.value = region;
    });

regionDropdown.onchange = function () {
    chrome.storage.sync.set({ "region": this.value });
    region = this.value;
};

var emptyDiv = document.createElement("div");
emptyDiv.classList.add("p-4");

var supportMe = document.createElement("a");
supportMe.innerHTML = "喜欢这个扩展吗？<br>请考虑<span class='underline'><a href='https://www.buymeacoffee.com/anzorq' target='_blank'>支持作者</a></span>";
supportMe.classList.add("text-sm", "text-gray-500");


optionsDiv.appendChild(title);
optionsDiv.appendChild(divNumResultsSlider);
optionsDiv.appendChild(numResultsSlider);
optionsDiv.appendChild(timePeriodLabel);
optionsDiv.appendChild(timePeriodDropdown);
optionsDiv.appendChild(regionDropdown);
optionsDiv.appendChild(emptyDiv);
optionsDiv.appendChild(supportMe);


var navMenu = document.querySelector('nav');
navMenu.appendChild(divider);
navMenu.appendChild(optionsDiv);
