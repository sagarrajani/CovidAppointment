const fs = require('fs');
const _ = require('lodash')
const request = require('request')

const start1 = async function(){
    const zipCodes = JSON.parse(await getPAZipCodes());
    var riteAids = []
    for(var i=0;i<zipCodes.length;i++){
        console.log(zipCodes[i])
        var riteAid = JSON.parse(await getRiteAid(zipCodes[i])).Data.stores
        console.log(riteAid.length)
        riteAids = riteAids.concat(riteAid)
        console.log(riteAids.length)
        await sleep(100)
    }
    fs.writeFileSync('./riteAids.json',JSON.stringify(riteAids))
}

const start = async function(){
    var stores = JSON.parse(fs.readFileSync('./riteAidsuniqStores.json'))
    stores = _.reverse(stores)
    for(var i=0;i<stores.length;i++){
        stores.availability = JSON.parse(await checkAvailability(stores[i].storeNumber)).Data.slots
        if(_.includes(stores.availability,true)){
            console.log(stores[i].address+","+stores[i].zipcode)
        }
        // await sleep(2000)
    }
    fs.writeFileSync('./riteAidsAvailability.json',JSON.stringify(stores))
}

const getRiteAid = async function(zipcode){
    return new Promise((resolve,reject) => {
        var options = {
            'method': 'GET',
            'url': `https://www.riteaid.com/services/ext/v2/stores/getStores?address=${zipcode}&attrFilter=PREF-112&fetchMechanismVersion=2&radius=50`,
            'headers': {
              'authority': 'www.riteaid.com',
              'accept': '*/*',
              'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.192 Safari/537.36',
              'x-requested-with': 'XMLHttpRequest',
              'sec-fetch-site': 'same-origin',
              'sec-fetch-mode': 'cors',
              'sec-fetch-dest': 'empty',
              'referer': 'https://www.riteaid.com/pharmacy/apt-scheduler',
              'accept-language': 'en-US,en;q=0.9',
              'cookie': '__ruid=149436981-hv-tm-4e-1p-vfdfm5g4bjg0zp85fztw-1606604180766; _mibhv=anon-1606604181269-2370422709_7189; _scid=9f9652ca-b4aa-45fa-9e05-813ff30f2c6f; _gcl_au=1.1.2114525210.1613410776; _ga=GA1.2.586528783.1613410776; __rcmp=0u0021bj1fZ2MsZj1nYyxzPTAsYz0xNDgsdHI9MCxybj01MjIsdHM9MjAyMTAyMTUuMTczOSxkPXBj; _gid=GA1.2.1354331873.1614608535; check=true; AMCVS_3B2A35975CF1D9620A495FA9%40AdobeOrg=1; s_campaign=%7C%7C%7C%7C%7C%7C%7C%7C; s_cc=true; s_fid=36817776DB86F746-14A313573A187C7F; dtm_token_sc=AQEHT7toFAYQ2wFHBPw2AQHwjwE; mage-cache-storage=%7B%7D; mage-cache-storage-section-invalidation=%7B%7D; rxVisitor=1614645275434V6RORK10EUIRTEKC6O73PJU3HHHL272K; dtSa=-; dtLatC=47; __rutmb=149436981; AMCV_3B2A35975CF1D9620A495FA9%40AdobeOrg=77933605%7CMCIDTS%7C18688%7CMCMID%7C20049453460473477463304903465664801265%7CMCAAMLH-1615250075%7C7%7CMCAAMB-1615250075%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1614652475s%7CNONE%7CvVersion%7C4.5.1; _uetsid=116ae3207aef11eb9525490c594d19ab; _uetvid=116b3a707aef11ebb9ec531cde9be777; form_key=QCttNi5wgDKz6caj; mage-cache-sessid=true; s_sq=%5B%5BB%5D%5D; mage-messages=; recently_viewed_product=%7B%7D; recently_viewed_product_previous=%7B%7D; recently_compared_product=%7B%7D; recently_compared_product_previous=%7B%7D; product_data_storage=%7B%7D; rxvt=1614647081300|1614645275436; dtPC=-15$45275426_447h-vIRPMSRPRMCOAEIVKHURMVMVMPKNPWWFF-0e1; dtCookie=v_4_srv_3_sn_46AUA71AO50TSIBO7FO52LDNSKUJSIFV_app-3Ab52fc261121850f8_1_ol_0_perc_100000_mul_1; _dc_gtm_UA-1427291-1=1; _gat_UA-1427291-1=1; mbox=PC#a8cad557694e4320bb0beaf064fb0bd7.34_0#1677871662|session#708a53a0aa16400687264726369f1b96#1614647206; adcloud={%22_les_v%22:%22y%2Criteaid.com%2C1614647145%22}; gpv_Page=web%3Apharmacy%3Aapt-scheduler; __rutma=149436981-hv-tm-4e-1p-vfdfm5g4bjg0zp85fztw-1606604180766.1614636689849.1614645275614.7.42.3; __rpck=0u0021eyJwcm8iOiJodHRwczovL2lucXVpcmVyLm1hcHMuYXJjZ2lzLmNvbS9hcHBzL0VtYmVkL2luZGV4Lmh0bWw/d2VibWFwPWZmNmU4YjA0MDg2YzQ5MWViZDAzYWI4YzMyMTVmYzQ2JmV4dGVudD0tNzUuOTM1LDM5LjcwMTEsLTc0LjQxODksNDAuNDQ4MiZ6b29tPXRydWUmcHJldmlld0ltYWdlPWZhbHNlJnNjYWxlPXRydWUmZGlzYWJsZV9zY3JvbGw9dHJ1ZSZ0aGVtZT1saWdodCIsImJ0Ijp7IjAiOnRydWUsIjEiOjAsIjIiOm51bGwsIjMiOjF9LCJDIjp7fSwiTiI6e319; _gat_rfk=1; s_plt=8.51; s_pltp=web%3Apharmacy%3Aapt-scheduler; __rpckx=0u0021eyJ0NyI6eyIyNiI6MTYxNDYyODU4NzgxOSwiMzEiOjE2MTQ2MzM0MTczOTZ9LCJ0N3YiOnsiMjYiOjE2MTQ2MzMzODc4ODcsIjMxIjoxNjE0NjQ1MzU3NjU1fSwiaXRpbWUiOiIyMDIxMDMwMS4yMTE2In0~; _gali=btn-find-store'
            }
          };
        request(options, function (error, response) {
            if (error) reject(error);
            resolve(response.body);
        });
    })
}

const checkAvailability = async function(storeNumber){
    return new Promise((resolve,reject) => {
    var options = {
        'method': 'GET',
        'url': 'https://www.riteaid.com/services/ext/v2/vaccine/checkSlots?storeNumber='+storeNumber,
        'headers': {
          'authority': 'www.riteaid.com',
          'accept': '*/*',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.192 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://www.riteaid.com/pharmacy/apt-scheduler',
          'accept-language': 'en-US,en;q=0.9'
        }
      };
      request(options, function (error, response) {
        if (error) reject(error);
        resolve(response.body);
      });
    })
      
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const getPAZipCodes = async function(){
    return new Promise((resolve,reject) => {
        var options = {
            'method': 'GET',
            'url': 'https://api.zip-codes.com/ZipCodesAPI.svc/1.0/GetAllZipCodes?state=PA&country=US&key=DEMOAPIKEY',
            'headers': {
            }
          };
          request(options, function (error, response) {
            if (error) reject(error);
            resolve(response.body);
          });
    })
}

start()