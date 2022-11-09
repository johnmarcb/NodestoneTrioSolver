console.clear();

let storage = getStorage();
let timeout = null;

function nodes() {
  return document.querySelector(".card.default .nodes");
}
function combinations() {
  return document.getElementById("combinations");
}
function lists() {
  return document.getElementById("accordionLists");
}

function generateCombinations(arr, maxNodes = 0) {   
  let temp = [];
  let f = function(current, next) { 
    next.forEach((a, i) => {        
      let t = current.slice(0);
      t.push(a.slice(0));
      temp.push(t);   
      f(t.slice(0), next.slice(i+1));      
    });
  }
  f([], arr);

  return onlyPossible(temp, maxNodes);
};
function onlyPossible(arr, maxNodes = 0) {
  let possible = [], occurrences, firstSkills;

  arr.forEach(nodeSet => {    
    nodeSet.sort();

    occurrences = {};

    // Track how many times the first skill conflicts.
    firstSkills = nodeSet.filter((theNode, i) => {
      return nodeSet.some((theNode2, i2) => theNode[0] === theNode2[0] && i !== i2);
    });        

    // Track how many times this skill appears throughout the set.        
    nodeSet.forEach(theNode => {       
      theNode.forEach(skill => {        
        occurrences[skill] ? occurrences[skill]++ : occurrences[skill] = 1;        
      });      
    });          
    occurrences = Object.values(occurrences);

    // Nodes cannot share the first skill or have a skill appear more than twice      
    if (firstSkills.length === 0 && occurrences.every(a => a <= 2) && nodeSet.every(theNode => theNode.length === 3)) {
      possible.push(nodeSet);
    }
  });

  possible = possible.filter(el => el.length <= maxNodes && el.length > 1);
  possible.sort();
  possible.sort((first, second) => second.length - first.length );

  return possible.slice(0, 100);
}

function clearResults(element, offset = 0) {
  while (element.childElementCount > offset) {
    element.removeChild(element.lastChild);
  }
}
function listResults(combos, maxNodes) {
  let count = 1, ul, counter, first, li, 
      skills, missing, key, 
      warning, hold, notFirst, result;

  combos.forEach((e, i) => {       
    counter = {};
    first = [];    

    ul = document.createElement("ul");        
    li = document.createElement("li");    

    li.textContent = `# ${count}`;
    li.classList.add("header-li");

    ul.classList.add("combination");    
    ul.appendChild(li);

    e.forEach(b => {    
      first.push(b[0]);
      b.forEach((c, i) => {
        counter[c] ? counter[c]++ : counter[c] = 1;        
      });
      li = document.createElement("li");
      li.textContent = b.join(", ");
      ul.appendChild(li);
    });    

    // Nodes must have every skill in the skill list. 
    // This will grab whatever's missing and set the count to 0
    skills = getSkills();
    missing = Object.keys(skills).filter(el => !counter[el]);    
    if (missing.length) {
      missing.forEach(el => counter[el] = 0);
    }

    // Show some extra information if there are missing nodes.
    warning = [];
    for (key in counter) {
      if (counter[key] == 0) {
        warning.push(`${key} (2)`)
      }
      else if (counter[key] < 2) {
        warning.push(key);
      }
    }

    // Adjust display so that the first slot of the missing 
    // skills aren't shared with the existing nodes.
    if (warning.length) {
      hold = [];
      notFirst = [];
      warning.forEach(el => {
        if (first.includes(el.replace(" (2)", ""))) {
          hold.push(el);
        }
        else {
          notFirst.push(el);
        }
      });
      warning = notFirst.concat(hold);

      li = document.createElement("li");
      result = `<small><span>Missing Nodestone:</span> ${warning.join(", ")}<br>
<span>${e.length} of ${maxNodes} slots used</span></small>`;
      if (((warning.length > 3 || warning.some(el => el.includes("(2)"))) && maxNodes - e.length <= 1) || 
          maxNodes - e.length === 0 && warning.length) {
        // Combination doesn't work, stop here.  
        return;
      }        
      li.innerHTML = result;
      li.classList.add("red");      
      ul.appendChild(li);            
    }        

    count++;
    ul.classList.add(warning.length ? "warn" : "success");
    combinations().appendChild(ul);    
  });

  if (!combinations().children.length) {
    li = document.createElement("li");
    li.textContent = "No possible combinations.";
    li.classList.add("combination");
    combinations().appendChild(li);
  }
}

function getNodes() {
  // Split by line, then trim.
  // Then split each line for the skills, trim each of those and get rid of empty skills
  // Finally, get rid of empy lines    

  let n = nodes().value.trim().split("\n")
  .map( e => e.trim() )
  .map( e => e.split(",").map(f => f.trim()).filter(g => g) )
  .filter( e => e.length );

  n.sort();    

  return n;
}
function getSkills(n = getNodes()) {
  let skills = {};

  n.forEach(a => {
    a.forEach(b => {
      skills[b] = b;
    });
  });

  return skills;
}

function save() {  
  localStorage.setItem("maple-nodestone", JSON.stringify(storage));
  let success = document.querySelector("span.hidealt.text-success");
  gsap.to(success, .3, {autoAlpha: 1}).then(e => {    
    if (!gsap.getTweensOf(success).length) {
      gsap.to(success, .4, {autoAlpha: 0, delay: 2}); 
    }    
  });
}
function getStorage() {
  let s = localStorage.getItem("maple-nodestone");
  if (s) {
    s = JSON.parse(s);    
  }
  else {
    s = [
      {
        id: "card-test",
        name: "Kanna (Example)",
        nodes: document.querySelector(".card.default .nodes").value,
        isDefault: true
      }
    ]
  }
  return s;
}
function loadStorage() {
  storage.forEach(el => {
    newList(el);    
  }); 
  let cards = [...document.querySelectorAll(".card")];

  let original = document.querySelector(".card.deleteme");
  lists().removeChild(original);  
}  

document.getElementById("listEdit").addEventListener("click", buttonListener);
document.getElementById("filter").addEventListener("change", e => {
  let value = e.target.value;    

  let li = document.querySelectorAll(".combination li");  
  let ul = document.querySelectorAll(".combination");

  let mostChildren = 0, temp = 0;
  ul.forEach(el => {
    if (value === "all") {
      el.classList.remove("hide");
    }
    else {
      el.classList.add("hide"); 
    }        

    temp = el.childElementCount;
    if (el.lastChild && el.lastChild.classList && el.lastChild.classList.contains("red")) temp--;

    if (temp > mostChildren) {
      mostChildren = temp;
    }
  });

  li.forEach(el => {   
    temp = el.parentNode.childElementCount;
    if (el.parentNode.lastChild.classList.contains("red")) temp--;

    if ((value === "best" && mostChildren === temp) || el.textContent.includes(value)) {
      el.parentNode.classList.remove("hide");
    }
  });

  if (combinations().children[0] && combinations().children[0].textContent.includes("No possible")) {
    combinations().children[0].classList.remove("hide");
  }

  let count = [...document.querySelectorAll(".combination.hide")].length;
  let count2 = [...document.querySelectorAll(".combination:not(.hide)")].length;

  let message = document.getElementById("filterMessage");
  if (count > 0) {
    message.innerHTML = `${count} combinations are hidden<br>${count2} combinations are visible`;
  }
  else {
    message.textContent = "";
  }
});
document.querySelector("#listEdit input").addEventListener("keyup", e => {
  let title = e.target.value;
  let id = e.target.getAttribute("data-card");  
  let header = document.querySelector(`#${id} .title`);

  header.childNodes[0].textContent = title;

  if (e.keyCode == 13) {
    edit(document.getElementById("listEdit"), "dismiss");    
  }
  
  editEntry(id, {name: title});  
});
document.querySelector("button[data-action='save']").addEventListener("click", buttonListener);
document.querySelector("button[data-action='create']").addEventListener("click", buttonListener);
window.addEventListener("keydown", e => {    
  if (e.key === "s" && e.ctrlKey) {
    e.preventDefault();
    save();
  }  
});
lists().addEventListener("click", buttonListener);
nodes().addEventListener("keyup", keyupListener);
nodes().dispatchEvent(new KeyboardEvent("keyup"));

function setDefault(target) {
  let def = document.querySelector(".card.default");
  if (def) {
    def.classList.remove("default");
  }  
  target.classList.add("default");
  
  defaultEntry(target.id);
  
  nodes().dispatchEvent(new Event("keyup"));
}
function toggleSettings(target) {
  target.classList.toggle("show");
  let show = target.classList.contains("show");
  let options = {
    autoAlpha: show ? 1 : 0,
    width: show ? "auto" : 0
  };  
  gsap.to(target, .25, options); 
}
function toggleList(target) {  
  target.classList.toggle("show");
  let show = target.classList.contains("show");
  let options = {
    height: show ? "auto" : 0
  }

  if (show) {
    target.querySelector("textarea").focus();
  }
  
  gsap.to(target, .25, options);

}
function deleteList(target) {
  let id = target.id;

  if (lists().querySelectorAll(".card").length <= 1) {
    gsap.fromTo(target, .1, {x: 5}, {ease:Sine.easeInOut, yoyo: true, x: -5, repeat: 3})
      .then(e => gsap.set(target, {x: 0}));
  }
  else {
    if (target.classList.contains("default") && lists().children[1]) {
      setDefault(lists().children[1]);        
    }        

    gsap.to(target, .25, {autoAlpha: 0, height: 0, y: -25}).then(e => {
      lists().removeChild(target);      
      deleteEntry(id);      
    });       
  }
}
function newList({name = "New List", nodes = "", id = "", isDefault = false}) {
  let clone = lists().querySelector(".card");
  if (clone) {
    clone = clone.cloneNode(true);        
  }  
  else {
    return;
  }

  let collapse = clone.querySelector(".collapse"), 
      header = clone.querySelector("button[data-action='toggle']"),
      textarea = clone.querySelector(".nodes");        

  clone.id = id || `card-${Date.now()}`;
  clone.classList.remove("default", "deleteme");    
  clone.querySelectorAll("[data-target]").forEach(el => {
    el.setAttribute("data-target", `#${clone.id}`);
  });  

  collapse.classList.remove("show");

  header.childNodes[0].textContent = name;      

  textarea.value = nodes;
  textarea.addEventListener("keyup", keyupListener);

  gsap.set(clone, {autoAlpha: 0, y: -25});    
  gsap.set(clone.querySelector(".settings"), {autoAlpha: 0, width: 0});
  gsap.set(collapse, {height: 0});     
  gsap.to(clone, .25, {autoAlpha: 1, y: 0});

  lists().appendChild(clone);

  if (!storage.some(el => el.id == clone.id)) {
    storage.push({
      id: clone.id,
      name: name,
      nodes: textarea.value,
      isDefault: false
    }); 
  }  

  if (isDefault) {
    setDefault(clone);
  }
  return clone;
}

function edit(target, action = "edit") {   
  let input = document.querySelector("#listEdit input");    
  let title = document.querySelector(`#${target.id} .title`);    
  let options = {
    background: action === "edit" ? "rgba(0, 0, 0, .2)" : "transparent",
    autoAlpha: action === "edit" ? 1 : 0
  }
  gsap.set("body", {overflow: action === "edit" ? "hidden" : "auto"});
  gsap.to("#listEdit", .25, options).then(() => { input.focus(); input.select() });

  if (action === "edit") {              
    input.value = title.childNodes[0].textContent;    
    input.setAttribute("data-card", target.id);        
  }
}
function editEntry(id, val) {
  let index = storage.findIndex(el => el.id == id);
  if (index > -1) {
    storage[index] = Object.assign(storage[index], val);
    save();
  }
}
function deleteEntry(id) {
  storage = storage.filter(el => el.id != id);
  save();
}
function defaultEntry(id) {
  storage = storage.map(el => Object.assign(el, {isDefault: el.id == id ? true : false}));
  save();
}

function keyupListener(e) {   
  let el = e.target.closest(".card.default");
  if (!el) {
    setDefault(e.target.closest(".card"));
    return;
  }
  document.documentElement.scrollTop = 0;          
  
  let n = getNodes();  
  let skills = getSkills(n);

  clearResults(combinations());
  clearResults(filter, 2);

  if (!n) return;

  let skillSize = Object.keys(skills).length;
  let maxNodes = Math.ceil(skillSize/ 3 * 2);

  let msg = document.getElementById("message");
  msg.innerHTML = `You'll need ${maxNodes} boost nodes in total.<br>
You listed ${Object.keys(skills).length} different skills: 
<code>${Object.values(skills).join(", ")}</code><br>`;

  let option;
  n.forEach(theNode => {
    option = document.createElement("option");
    option.value = theNode.join(", ");
    option.textContent = theNode.join(", ");
    filter.appendChild(option);
  });  
    
  if (timeout) {
    clearTimeout(timeout); 
  }  
  timeout = setTimeout(function() {    
    clearTimeout(timeout);
    firstTime = null;
    
    listResults(generateCombinations(n, maxNodes), maxNodes);

    document.getElementById("filter").value = "best";
    document.getElementById("filter").dispatchEvent(new Event("change"));    

    editEntry(el.id, {nodes: e.target.value});    
  }, 1000);      
}
function buttonListener(e) {
  if (e.target.id === "listEdit") {
    edit(e.target, "dismiss");
    return;
  }

  let target = e.target.tagName.toLowerCase() == "i" ? e.target.parentNode : e.target;
  
  let id = target.getAttribute("data-target"),
      action = target.getAttribute("data-action");     
  if (!id || !action) return;

  target = document.getElementById(id.substring(1));    

  switch (action) {
    case "delete": {
      deleteList(target);
      break;
    }
    case "toggle": {
      toggleList(target.querySelector(".collapse"));
      break;
    }
    case "load": {
      setDefault(target);
      break; 
    }
    case "create": {
      let newItem = newList({});      
      edit(newItem);
      break;
    }
    case "save": {
      save();
      break;
    }
    case "settings": {
      toggleSettings(target.querySelector(".settings"));
      break;
    }
    case "edit": {
      edit(target);
      break;
    }
    case "dismiss": {
      edit(target, action);
      break;
    }
  }
  
  if (document.querySelectorAll(".card").length === 1) {
    lists().classList.remove("scroller");
  }
  else {
    lists().classList.add("scroller");
  }
}

loadStorage();