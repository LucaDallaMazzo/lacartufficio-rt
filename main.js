import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";
// To use Html5QrcodeScanner (more info below)
import "./html5-qrcode.js";

// To use Html5Qrcode (more info below)
//import {Html5Qrcode} from "./html5-qrcode.js";

const supabaseUrl = 'https://eanaqzejvpuhjoaxpkdk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbmFxemVqdnB1aGpvYXhwa2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0NzA3NjcsImV4cCI6MjAyMzA0Njc2N30.qQcrXhRlZqgLH0MRapdZTs_40lm0qB_OXlU-qRs4Q1Q'
const supabase = createClient(supabaseUrl, supabaseKey)
let elements=[];

supabase
  .from('links')
  .select('*').then(({data:links,error})=>{
    document.getElementById("add").addEventListener("click",addElement)
    document.getElementById("search-input").addEventListener("input",searchElement)
    document.querySelectorAll("[type=checkbox]").forEach(e=>e.addEventListener("change",searchDueElement))
    
    document.getElementById('qr-input-file').addEventListener('change',qrCodeInput)
    elements=links.map(l=>{return{link:l.links}});renderElements()
  })
          

const lisIndexes={
  "Matricola":{index:0,removeStr:"Matricola: "},
  "Stato":{index:1,removeStr:"Stato: "},
  "Esito verificazione":{index:14,removeStr:""},
}

const nameIndex = {index:30,removeStr:"Denominazione: "}
const lastVerIndex = {index:13,removeStr:"Data: "}
const lastTrasmIndex = {index:18,removeStr:"Data: "}
const versDispIndex = {index:21,removeStr:"Versione: "}
const versModelIndex = {index:25,removeStr:"Versione: "}

function renderElements(){
  document.getElementById("card-container").innerHTML=""
  document.getElementById("card-container").style.display="none"
  document.getElementById("loading").style.display="flex"
  let counter = 0;
  elements.forEach(el=>{
    fetch(el.link).then(r=>r.text()).catch(e=>{
      let card = getErrorCard(el,e)
      document.getElementById("card-container").append(card)
      throw e
    }).then(htmlString=>{
      let card = getCard(el,htmlString)
      document.getElementById("card-container").append(card)
    }).finally(()=>{
      counter ++
      if(counter==elements.length){
        document.getElementById("loading").style.display="none"
        document.getElementById("card-container").style.display="flex"

        var removes = document.getElementsByClassName("remove")
        for (var i = 0; i < removes.length; i++) {
          removes[i].addEventListener("click",removeElement)
        }

        var h4s = document.getElementsByTagName("h4")
        for (var i = 0; i < h4s.length; i++) {
          h4s[i].addEventListener("click",expandCard)
        }

        var cards = Array.from(document.getElementsByClassName("card"))
        cards.sort((a,b)=>a.dataset.name.toLowerCase().localeCompare(b.dataset.name.toLowerCase())).forEach((c,i)=>{
          document.querySelector("[data-name='"+c.dataset.name+"']").style.order = i
        })
      }
    })
  })
}

function getCard(el,htmlString){
  let html = document.createElement("div")
  html.innerHTML=htmlString

  let lis = html.getElementsByTagName("li");
  /*for (let i=0;i<lis.length;i++) {
    let li = lis[i];
    console.log(i,li.innerText.trim())
  }*/
  var card = document.createElement("div");
  let nameVal = lis[nameIndex.index]?.innerText.trim().replace(nameIndex.removeStr,'')
  let lastVerVal = (lis[lastVerIndex.index]?.innerText.trim().replace(lastVerIndex.removeStr,''))?.split("/")
  let lastTrasmVal = (lis[lastTrasmIndex.index]?.innerText.trim().replace(lastTrasmIndex.removeStr,''))?.split("/")
  let versDispVal = lis[versDispIndex.index]?.innerText.trim().replace(versDispIndex.removeStr,'')
  let versModelVal = lis[versModelIndex.index]?.innerText.trim().replace(versModelIndex.removeStr,'')
  if(lastVerVal)
    lastVerVal = lastVerVal[1]+"/"+lastVerVal[0]+"/"+lastVerVal[2]
  if(lastTrasmVal)
    lastTrasmVal = lastTrasmVal[1]+"/"+lastTrasmVal[0]+"/"+lastTrasmVal[2]
  let twoWeeksMilli = 2*7*24*60*60*1000
  let twoYearsMilli = 2*365*24*60*60*1000
  let lastVerDue = (new Date().getTime()-new Date(lastVerVal).getTime()) > twoYearsMilli
  let lastTrasmDue = (new Date().getTime()-new Date(lastTrasmVal).getTime()) > twoWeeksMilli

  let notEqVer = (versDispVal?.toString().trim()!=versModelVal?.toString().trim())

  card.innerHTML=`
  <h4>${nameVal} <button class="remove" data-link="${el.link}">Remove</button></h4>
  ${Object.keys(lisIndexes).map(k=>{
    let index = lisIndexes[k].index
    let removeStr = lisIndexes[k].removeStr
    let value = lis[index]?.innerText.trim().replace(removeStr,'')
    return `<div><span>${k}:</span> <span>${value}</span></div>`
  }).join('')}
  <div class="${lastVerDue?"due":""}"><span>${"Ultima verificazione"}:</span> <span>${new Date(lastVerVal).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"})}</span> </div>
  <div class="${lastTrasmDue?"due":""}"><span>${"Ultima trasmissione"}:</span> <span>${new Date(lastTrasmVal).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"})}</span></div>
  <div class="${notEqVer?"due":""}"><span>${"Versione dispositivo"}:</span> <span>${versDispVal}</span></div>
  <div class="${notEqVer?"due":""}"><span>${"Versione modello"}:</span> <span>${versModelVal}</span></div>
  `
  card.className="card"
  card.dataset.name=nameVal
  card.dataset.lastVerDue=lastVerDue
  card.dataset.lastTrasmDue=lastTrasmDue
  card.dataset.noteqver=notEqVer
  return card
}

function getErrorCard(el,err){
  var card = document.createElement("div");
  card.innerHTML=`
  <h4>${el.link} <button class="remove" data-link="${el.link}">Remove</button></h4>
  <div class="error"><span>Error:</span> <span>Impossibile raggiungere il link</span></div>
  `
  card.className="card"
  card.dataset.name=el.link
  return card
}



function addElement(){
  elements.push({
    link:document.getElementById("newEl-link").value.trim(),
  })
  supabase
  .from('links')
  .insert([
    { links: document.getElementById("newEl-link").value.trim() },
  ])
  .select().then(console.log)
          
  renderElements()
  document.getElementById("newEl-link").value = ""
}

function removeElement(e){
  e.preventDefault()
  e.stopPropagation()
  let link = e.target.dataset.link.trim()
  if(!confirm("Confermi di voler eliminare l'elemento?"))return
  let idx = elements.findIndex(e=>e.link==link)
  if(idx>=0)
    elements.splice(idx,1)
  supabase
  .from('links')
  .delete()
  .eq('links', link).then(console.log)
          
  renderElements()
}

function expandCard(e){
  e.target.closest(".card").classList.toggle("expanded")
}

function searchElement(){
  let value = document.getElementById("search-input").value
  let cards =document.getElementsByClassName("card")
  for(let idx = 0; idx < cards.length;idx++){
    let card = cards[idx]
    if(value && value.trim()!=""){
      if(card.dataset.name.toLowerCase().includes(value.toLowerCase())){
        card.style.display="block"
      }else{
        card.style.display="none"
      }
    }else
      card.style.display="block"
  }
}

function searchDueElement(){
  let lastVerDue = document.getElementById("last-ver-due-ckb").checked
  let lastTrasmDue = document.getElementById("last-trasm-due-ckb").checked
  let noteqver = document.getElementById("noteqver-ckb").checked
  let cards =document.getElementsByClassName("card")
  for(let idx = 0; idx < cards.length;idx++){
    let card = cards[idx]
    if(
      (lastVerDue && card.dataset.lastVerDue=="true")||
      (lastTrasmDue && card.dataset.lastTrasmDue=="true")||
      (noteqver && card.dataset.noteqver=="true") ||
      (!lastVerDue && !lastTrasmDue && !noteqver)
    ){
      card.style.display="block"
    }else{
      card.style.display="none"
    }
  }

}

function qrCodeInput(e){
  const html5QrCode = new Html5Qrcode(/* element id */ "reader");
  if (e.target.files.length == 0) {
    // No file selected, ignore 
    return;
  }

  // Use the first item in the list
  const imageFile = e.target.files[0];
  html5QrCode.scanFile(imageFile, /* showImage= */false)
  .then(qrCodeMessage => {
    // success, use qrCodeMessage
    console.log(qrCodeMessage);
    document.getElementById("newEl-link").value = qrCodeMessage
  })
  .catch(err => {
    // failure, handle it.
    console.log(`Error scanning file. Reason: ${err}`)
    alert("Errore scansione QRCode. Riprovare.")
  }).finally(()=>{
    html5QrCode.clear()
  });
}