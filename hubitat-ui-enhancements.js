// ==UserScript==
// @name     Hubitat UI enhancements
// @version  1
// @grant    none
// @include  http://192.168.0.100/*
// @require  https://code.highcharts.com/stock/highstock.js
// @require  https://code.highcharts.com/stock/modules/data.js
// @require  https://code.highcharts.com/stock/highcharts-more.js
// @require  https://code.highcharts.com/stock/modules/exporting.js
// @require  https://momentjs.com/downloads/moment.js
// @run-at document-end
// ==/UserScript==

(function () {
  onLocationChanged();
  if (!document.title.includes('Hubitat'))
    document.title = `Hubitat - ${document.title}`;

  var nav = document.getElementsByTagName("nav")[0];
  if (nav) {
    if (![...nav.getElementsByClassName('mdl-navigation__link')].find(item => item.innerText.includes('Rule'))) {
      var link = document.createElement("a");
      link.classList.add("mdl-navigation__link");
      link.href = "/installedapp/list?display=rulemachine";
      link.innerHTML = "<i class=\"material-icons he-apps_21\"></i>Rules";

      nav.insertBefore(link, nav.childNodes[8]);
    }
  }

  if (window.location.href.endsWith('/installedapp/list?display=rulemachine')) {
    document.title = 'Hubitat - Rules';
    document.getElementsByClassName('mdl-layout-title')[0].firstChild.innerHTML = 'Rules';

    nav.getElementsByClassName('is-active')[0].classList.remove('is-active');
    link.classList.add('is-active');

    var appTable = document.getElementById('app-table');
    var divs = appTable.getElementsByClassName('app-row-link');
    var ruleMachine = [...divs].find(div => div.children[0].innerText == 'Rule Machine');
    var ruleMachineId = ruleMachine.parentElement.getAttribute('data-id');

    var buttonsContainer = document.getElementById('buttonsContainer');
    buttonsContainer.children[0].remove();
    buttonsContainer.children[0].innerHTML = `<a href="/installedapp/createchild/hubitat/Rule-5.1/parent/${ruleMachineId}" class="btn btn-default btn-lg btn-block hrefElem mdl-button--raised mdl-shadow--2dp" style="text-align:left">
                                            <span class="he-add_2"></span> <span class="pre">Create New Rule</span>
                                        </a>`;

    var rules = [...ruleMachine.parentElement.parentElement.children].slice(1).map(rule => rule.children[2]);
    //appTable.children[0].children[0].children[1].remove();
    appTable.children[0].style.display = 'none';

    var tbody = appTable.children[1];
    tbody.innerHTML = '';
    var lastRoom = '';
    rules.forEach(rule => {
      if (rule) {
        var ruleName = rule.children[0].innerText;
        var splitter = ruleName.includes('-') ? '-' : ' ';
        var room = ruleName.split(splitter)[0].trim();

        if (room != lastRoom) {
          var trRoom = document.createElement("tr")
          trRoom.classList.add("group");
          trRoom.innerHTML = `<td style="display: none"></td><td><b>${room}</b></td>`;
          tbody.append(trRoom);
        }
        lastRoom = room;

        var tr = document.createElement("tr")
        tr.innerHTML = `<td style="display: none"></td><td><div style="padding-left: 15px">${rule.innerHTML}</div></td>`;
        tbody.append(tr);
      }
    });
  }
  else if (window.location.href.endsWith('/mainPage/selectActions')) {
    waitForRuleEditor(false);
  }
  else if (window.location.pathname == '/dashboards') {
    var headers = document.body.getElementsByTagName('header');
    if (headers && headers[0]) headers[0].remove();
  }
  else if (window.location.href.includes('/device/edit/')) {
    var navigation = document.getElementsByTagName('main')[0].children[1].children[0].children[0].children[0];
    var graphLink = document.createElement('span');
    var href = navigation.children[navigation.children.length - 1].href;
    graphLink.innerHTML = `<a href="${href}?display=graph" class=""><button class="mdl-button mdl-js-button mdl-button--raised " data-upgraded=",MaterialButton"><i class="he-info_1"></i> Graph</button></a>`;
    navigation.appendChild(graphLink);
  }
  else if (window.location.href.includes('/device/events/') && window.location.href.includes('display=graph')) {
    const capabilitiesToIgnore = ['driver', 'batteryLastReplaced', 'lastCheckin', 'notPresentCounter', 'restoredCounter', 'colorName', 'mediaSource', 'status'];
    var deviceId = document.getElementById('events-table').getAttribute('data-device-id');
    var mdlTtable = document.getElementById('mdl-table');
    mdlTtable.innerHTML = '<div id="chart"></div>';
    try {
      var req = new XMLHttpRequest();
      req.responseType = 'json';
      req.onload = function () {
        try {
          var capabilities = req.response.data.map(d => d[1]).filter((v, i, a) => a.indexOf(v) === i && capabilitiesToIgnore.indexOf(v) === -1);
          var chart = {
            chart: { type: 'area' },
            title: { text: "Events" },
            //subtitle: { text: document.ontouchstart === undefined ? 'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in' },
            //zoomType: 'x',
            xAxis: { type: 'datetime', ordinal: false },
            yAxis: capabilities.map(capability => getYAxis(capability)),
            series: capabilities.map(capability => {
              var data = req.response.data.filter(d => d[1] == capability).map(d => {
                var result = [(new moment(d[7], 'YYYY-MM-DD HH:mm:ss ZZZ')).valueOf(), getCapabilityValue(capability, d[2])];
                return result;
              }).sort((d1, d2) => d1[0] - d2[0]);

              var series =
              {
                name: capability,
                color: "#0071A7",
                type: "area",
                data: data,
                step: "left",
                yAxis: capabilities.indexOf(capability)
              };
              return series;
            }),
            rangeSelector: {
              //selected: 2
              buttons: [
                {
                  type: 'minute',
                  count: 5,
                  text: '5m',
                  title: 'View 5 minutes'
                }, {
                  type: 'minute',
                  count: 30,
                  text: '30m',
                  title: 'View 30 minutes'
                }, {
                  type: 'hour',
                  count: 1,
                  text: '1h',
                  title: 'View 1 hour'
                }, {
                  type: 'hour',
                  count: 4,
                  text: '4h',
                  title: 'View 4 hours'
                }, {
                  type: 'hour',
                  count: 12,
                  text: '12h',
                  title: 'View 12 hours'
                }, {
                  type: 'day',
                  count: 1,
                  text: '1d',
                  title: 'View 1 day'
                }, {
                  type: 'week',
                  count: 1,
                  text: '1w',
                  title: 'View 1 week'
                }, {
                  type: 'month',
                  count: 1,
                  text: '1M',
                  title: 'View 1 month'
                }, {
                  type: 'month',
                  count: 3,
                  text: '3M',
                  title: 'View 3 months'
                }, {
                  type: 'month',
                  count: 6,
                  text: '6M',
                  title: 'View 6 months'
                }, {
                  type: 'ytd',
                  text: 'YTD',
                  title: 'View year to date'
                }, {
                  type: 'year',
                  count: 1,
                  text: '1y',
                  title: 'View 1 year'
                }, {
                  type: 'all',
                  text: 'All',
                  title: 'View all'
                }]
            },
            credits: { enabled: false },
            legend: { enabled: true },
            navigator: {
              series: { type: 'area', step: 'left' }
            }
          };

          window.requestAnimationFrame = unsafeWindow.requestAnimationFrame;
          Highcharts.stockChart("chart", chart);
        } catch (ex) {
          alert(ex);
        }
      };
      req.open('GET', `/device/events/${deviceId}/dataTablesJson?draw=1&columns[0][search][regex]=false&columns[1][search][regex]=false&columns[2][search][regex]=false&columns[3][search][regex]=false&columns[4][search][regex]=false&columns[5][search][regex]=false&columns[6][search][regex]=false&columns[7][name]=DATE&columns[7][search][regex]=false&order[0][column]=7&order[0][dir]=desc&start=0&length=200`);
      req.send();

    } catch (ex) {
      alert(ex);
    }
  }
  else if (window.location.href.includes('/device/events/')) {
    var searchBox = document.getElementById('searchBox').parentElement;
    var navigationEvents = document.getElementsByTagName('main')[0].children[0].children[0].children[0];
    navigationEvents.appendChild(searchBox);
    //this doesn't work and the horizontal scrollbar is still there (width stays at 100%)
    //document.getElementById('events-table').style.width = 'calc(100% - 2px)';
  }

})();

//can't be in DOMContentLoaded, it's plain text
if (window.location.pathname == '/hub/zigbee/getChildAndRouteInfo') {
  if (!document.title)
    document.title = 'Hubitat - Route info';
  else if (!document.title.includes('Hubitat'))
    document.title = `Hubitat - ${document.title}`;

  //encoding fix doesn't work, it would have to change to proper HTML instead of plain text
  //document.head.innerHTML = '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8"> ';
}

function getYAxis(capability) {
  var axis =
  {
    title: {
      text: capability
    }
  };

  switch (capability) {
    case 'switch':
    case 'contact':
    case 'motion':
    case 'presence':
    case 'mute':
      axis.min = 0;
      axis.max = 1;
      axis.tickAmount = 2;
      //axis.allowDecimals = false;
      break;
    case 'level':
    case 'hue':
    case 'saturation':
    case 'position':
    case 'battery':
      axis.min = 0;
      axis.max = 100;
      axis.tickAmount = 5;
      break;
    case 'windowShade':
      axis.min = 0;
      axis.max = 2;
      axis.tickAmount = 3;
      //axis.allowDecimals = false;
      break;
  }

  return axis;
}

function getCapabilityValue(capability, value) {
  switch (capability) {
    case 'switch': return value == 'on' ? 1 : 0;
    case 'contact': return value == 'open' ? 1 : 0;
    case 'motion': return value == 'active' ? 1 : 0;
    case 'presence': return value == 'present' ? 1 : 0;
    case 'windowShade': return value == 'open' ? 2 : value == 'closed' ? 0 : 1;
    case 'mute': return value == 'muted' ? 1 : 0;
    default: return parseInt(value);
  }
}

function waitForRuleEditor(scroll) {
  if (!document.getElementById('formApp')) {
    setTimeout(function () { waitForRuleEditor(scroll); }, 300);
    return;
  }
  var parent = document.getElementById('formApp').getElementsByClassName('mdl-grid')[0].children[0].children[0];
  var span = parent.children[0];
  var ruleText = span.innerHTML;
  var rules = ruleText.split(/\r?\n/).filter(x => x !== '');
  var script = document.createElement("script");
  script.innerHTML =
    `function ruleEdit(action, index) {
  var ddl = document.getElementById(\`settings[$\{action\}Act]\`);
  ddl.selectedIndex = action == 'delete' ? index : index + 1;
  changeSubmit(ddl);
  return false;
}`;
  document.head.appendChild(script);

  var style = document.createElement("style");
  style.innerHTML =
    `
#ruleEditor {
  border-collapse: collapse;
}

#ruleEditor a {
  display: none;
}

#ruleEditor tr:hover {
  background-color: #ffff99;
}

#ruleEditor tr:hover a{
  display: block;
}
`;
  document.head.appendChild(style);

  var rows = '';
  var table = document.createElement("table");
  table.id = "ruleEditor";

  rules.forEach((rule, i) => {
    rows += `<tr>
							<td>${rule}</td>
							<td><a href="#" onclick="ruleEdit('insert', ${i})" title="Insert action before"><i class=\"material-icons\">add</i></a></td>
							<td><a href="#" onclick="ruleEdit('edit', ${i})" title="Edit action"><i class=\"material-icons\">edit</i></a></td>
							<td><a href="#" onclick="ruleEdit('delete', ${i})" title="Delete action"><i class=\"material-icons\">delete</i></a></td>
						</tr>`;
  });

  table.innerHTML = rows;
  parent.replaceChild(table, span);
  var a = document.createElement('a');
  a.id = 'actions';
  parent.appendChild(a, 1);
  onRemove(table, function () { waitForRuleEditor(true); });
  if (scroll)
    document.getElementById('actions').scrollIntoView();
}

function onLocationChanged() {
  var oldHref = document.location.href;
  var bodyList = document.querySelector("body");
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (oldHref != document.location.href && document.location.href.endsWith('/mainPage/selectActions')) {
        oldHref = document.location.href;
        waitForRuleEditor(false);
      }
    });
  });

  var config = {
    childList: true,
    subtree: true
  };

  observer.observe(bodyList, config);
}

function onRemove(element, callback) {
  try {
    const obs = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const el of mutation.removedNodes) {
          var parent = element;
          while (parent) {
            if (el === parent) {
              obs.disconnect();
              callback();
            }
            parent = parent.parentElement;
          }
        }
      }
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
    });
  } catch (ex) {
    alert(ex);
  }
}