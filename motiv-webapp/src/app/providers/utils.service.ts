/*
(C) 2017-2020 - The Woorti app is a research (non-commercial) application that was
developed in the context of the European research project MoTiV (motivproject.eu). The
code was developed by partner INESC-ID with contributions in graphics design by partner
TIS. The Woorti app development was one of the outcomes of a Work Package of the MoTiV
project.
 
The Woorti app was originally intended as a tool to support data collection regarding
mobility patterns from city and country-wide campaigns and provide the data and user
management to campaign managers.
 
The Woorti app development followed an agile approach taking into account ongoing
feedback of partners and testing users while continuing under development. This has
been carried out as an iterative process deploying new app versions. Along the 
timeline,various previously unforeseen requirements were identified, some requirements
Were revised, there were requests for modifications, extensions, or new aspects in
functionality or interaction as found useful or interesting to campaign managers and
other project partners. Most stemmed naturally from the very usage and ongoing testing
of the Woorti app. Hence, code and data structures were successively revised in a
way not only to accommodate this but, also importantly, to maintain compatibility with
the functionality, data and data structures of previous versions of the app, as new
version roll-out was never done from scratch.

The code developed for the Woorti app is made available as open source, namely to
contribute to further research in the area of the MoTiV project, and the app also makes
use of open source components as detailed in the Woorti app license. 
 
This project has received funding from the European Union’s Horizon 2020 research and
innovation programme under grant agreement No. 770145.
 
This file is part of the Woorti app referred to as SOFTWARE.
*/
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Provides util support to other modules
 */
export class UtilsService {

  //Country information
  countryList = {
    "AFG": { code: "AF",  iso: "AFG", name: "Afghanistan"},
    "ALB": { code: "AL",  iso: "ALB", name: "Albania"},
    "DZA": { code: "DZ",  iso: "DZA", name: "Algeria"},
    "ASM": { code: "AS",  iso: "ASM", name: "American Samoa"},
    "AND": { code: "AD",  iso: "AND", name: "Andorra"},
    "AGO": { code: "AO",  iso: "AGO", name: "Angola"},
    "AIA": { code: "AI",  iso: "AIA", name: "Anguilla"},
    "ATA": { code: "AQ",  iso: "ATA", name: "Antarctica"},
    "ATG": { code: "AG",  iso: "ATG", name: "Antigua and Barbuda"},
    "ARG": { code: "AR",  iso: "ARG", name: "Argentina"},
    "ARM": { code: "AM",  iso: "ARM", name: "Armenia"},
    "ABW": { code: "AW",  iso: "ABW", name: "Aruba"},
    "AUS": { code: "AU",  iso: "AUS", name: "Australia"},
    "AUT": { code: "AT",  iso: "AUT", name: "Austria"},
    "AZE": { code: "AZ",  iso: "AZE", name: "Azerbaijan"},
    "BHS": { code: "BS",  iso: "BHS", name: "Bahamas"},
    "BHR": { code: "BH",  iso: "BHR", name: "Bahrain"},
    "BGD": { code: "BD",  iso: "BGD", name: "Bangladesh"},
    "BRB": { code: "BB",  iso: "BRB", name: "Barbados"},
    "BLR": { code: "BY",  iso: "BLR", name: "Belarus"},
    "BEL": { code: "BE",  iso: "BEL", name: "Belgium"},
    "BLZ": { code: "BZ",  iso: "BLZ", name: "Belize"},
    "BEN": { code: "BJ",  iso: "BEN", name: "Benin"},
    "BMU": { code: "BM",  iso: "BMU", name: "Bermuda"},
    "BTN": { code: "BT",  iso: "BTN", name: "Bhutan"},
    "BOL": { code: "BO",  iso: "BOL", name: "Bolivia"},
    "BES": { code: "BQ",  iso: "BES", name: "Bonaire, Sint Eustatius and Saba"},
    "BIH": { code: "BA",  iso: "BIH", name: "Bosnia and Herzegovina"},
    "BWA": { code: "BW",  iso: "BWA", name: "Botswana"},
    "BVT": { code: "BV",  iso: "BVT", name: "Bouvet Island"},
    "BRA": { code: "BR",  iso: "BRA", name: "Brazil"},
    "IOT": { code: "IO",  iso: "IOT", name: "British Indian Ocean Territory"},
    "VGB": { code: "VG",  iso: "VGB", name: "British Virgin Islands"},
    "BRN": { code: "BN",  iso: "BRN", name: "Brunei"},
    "BGR": { code: "BG",  iso: "BGR", name: "Bulgaria"},
    "BFA": { code: "BF",  iso: "BFA", name: "Burkina Faso"},
    "BDI": { code: "BI",  iso: "BDI", name: "Burundi"},
    "KHM": { code: "KH",  iso: "KHM", name: "Cambodia"},
    "CMR": { code: "CM",  iso: "CMR", name: "Cameroon"},
    "CAN": { code: "CA",  iso: "CAN", name: "Canada"},
    "CPV": { code: "CV",  iso: "CPV", name: "Cape Verde"},
    "CYM": { code: "KY",  iso: "CYM", name: "Cayman Islands"},
    "CAF": { code: "CF",  iso: "CAF", name: "Central African Republic"},
    "TCD": { code: "TD",  iso: "TCD", name: "Chad"},
    "CHL": { code: "CL",  iso: "CHL", name: "Chile"},
    "CHN": { code: "CN",  iso: "CHN", name: "China"},
    "CXR": { code: "CX",  iso: "CXR", name: "Christmas Island"},
    "CCK": { code: "CC",  iso: "CCK", name: "Cocos Islands"},
    "COL": { code: "CO",  iso: "COL", name: "Colombia"},
    "COM": { code: "KM",  iso: "COM", name: "Comoros"},
    "COG": { code: "CG",  iso: "COG", name: "Congo"},
    "COK": { code: "CK",  iso: "COK", name: "Cook Islands"},
    "CRI": { code: "CR",  iso: "CRI", name: "Costa Rica"},
    "HRV": { code: "HR",  iso: "HRV", name: "Croatia"},
    "CUB": { code: "CU",  iso: "CUB", name: "Cuba"},
    "CUW": { code: "CW",  iso: "CUW", name: "Curaçao"},
    "CYP": { code: "CY",  iso: "CYP", name: "Cyprus"},
    "CZE": { code: "CZ",  iso: "CZE", name: "Czech Republic"},
    "CIV": { code: "CI",  iso: "CIV", name: "Côte d'Ivoire"},
    "DNK": { code: "DK",  iso: "DNK", name: "Denmark"},
    "DJI": { code: "DJ",  iso: "DJI", name: "Djibouti"},
    "DMA": { code: "DM",  iso: "DMA", name: "Dominica"},
    "DOM": { code: "DO",  iso: "DOM", name: "Dominican Republic"},
    "ECU": { code: "EC",  iso: "ECU", name: "Ecuador"},
    "EGY": { code: "EG",  iso: "EGY", name: "Egypt"},
    "SLV": { code: "SV",  iso: "SLV", name: "El Salvador"},
    "GNQ": { code: "GQ",  iso: "GNQ", name: "Equatorial Guinea"},
    "ERI": { code: "ER",  iso: "ERI", name: "Eritrea"},
    "EST": { code: "EE",  iso: "EST", name: "Estonia"},
    "ETH": { code: "ET",  iso: "ETH", name: "Ethiopia"},
    "FLK": { code: "FK",  iso: "FLK", name: "Falkland Islands"},
    "FRO": { code: "FO",  iso: "FRO", name: "Faroe Islands"},
    "FJI": { code: "FJ",  iso: "FJI", name: "Fiji"},
    "FIN": { code: "FI",  iso: "FIN", name: "Finland"},
    "FRA": { code: "FR",  iso: "FRA", name: "France"},
    "GUF": { code: "GF",  iso: "GUF", name: "French Guiana"},
    "PYF": { code: "PF",  iso: "PYF", name: "French Polynesia"},
    "ATF": { code: "TF",  iso: "ATF", name: "French Southern Territories"},
    "GAB": { code: "GA",  iso: "GAB", name: "Gabon"},
    "GMB": { code: "GM",  iso: "GMB", name: "Gambia"},
    "GEO": { code: "GE",  iso: "GEO", name: "Georgia"},
    "DEU": { code: "DE",  iso: "DEU", name: "Germany"},
    "GHA": { code: "GH",  iso: "GHA", name: "Ghana"},
    "GIB": { code: "GI",  iso: "GIB", name: "Gibraltar"},
    "GRC": { code: "GR",  iso: "GRC", name: "Greece"},
    "GRL": { code: "GL",  iso: "GRL", name: "Greenland"},
    "GRD": { code: "GD",  iso: "GRD", name: "Grenada"},
    "GLP": { code: "GP",  iso: "GLP", name: "Guadeloupe"},
    "GUM": { code: "GU",  iso: "GUM", name: "Guam"},
    "GTM": { code: "GT",  iso: "GTM", name: "Guatemala"},
    "GGY": { code: "GG",  iso: "GGY", name: "Guernsey"},
    "GIN": { code: "GN",  iso: "GIN", name: "Guinea"},
    "GNB": { code: "GW",  iso: "GNB", name: "Guinea-Bissau"},
    "GUY": { code: "GY",  iso: "GUY", name: "Guyana"},
    "HTI": { code: "HT",  iso: "HTI", name: "Haiti"},
    "HMD": { code: "HM",  iso: "HMD", name: "Heard Island And McDonald Islands"},
    "HND": { code: "HN",  iso: "HND", name: "Honduras"},
    "HKG": { code: "HK",  iso: "HKG", name: "Hong Kong"},
    "HUN": { code: "HU",  iso: "HUN", name: "Hungary"},
    "ISL": { code: "IS",  iso: "ISL", name: "Iceland"},
    "IND": { code: "IN",  iso: "IND", name: "India"},
    "IDN": { code: "ID",  iso: "IDN", name: "Indonesia"},
    "IRN": { code: "IR",  iso: "IRN", name: "Iran"},
    "IRQ": { code: "IQ",  iso: "IRQ", name: "Iraq"},
    "IRL": { code: "IE",  iso: "IRL", name: "Ireland"},
    "IMN": { code: "IM",  iso: "IMN", name: "Isle Of Man"},
    "ISR": { code: "IL",  iso: "ISR", name: "Israel"},
    "ITA": { code: "IT",  iso: "ITA", name: "Italy"},
    "JAM": { code: "JM",  iso: "JAM", name: "Jamaica"},
    "JPN": { code: "JP",  iso: "JPN", name: "Japan"},
    "JEY": { code: "JE",  iso: "JEY", name: "Jersey"},
    "JOR": { code: "JO",  iso: "JOR", name: "Jordan"},
    "KAZ": { code: "KZ",  iso: "KAZ", name: "Kazakhstan"},
    "KEN": { code: "KE",  iso: "KEN", name: "Kenya"},
    "KIR": { code: "KI",  iso: "KIR", name: "Kiribati"},
    "KWT": { code: "KW",  iso: "KWT", name: "Kuwait"},
    "KGZ": { code: "KG",  iso: "KGZ", name: "Kyrgyzstan"},
    "LAO": { code: "LA",  iso: "LAO", name: "Laos"},
    "LVA": { code: "LV",  iso: "LVA", name: "Latvia"},
    "LBN": { code: "LB",  iso: "LBN", name: "Lebanon"},
    "LSO": { code: "LS",  iso: "LSO", name: "Lesotho"},
    "LBR": { code: "LR",  iso: "LBR", name: "Liberia"},
    "LBY": { code: "LY",  iso: "LBY", name: "Libya"},
    "LIE": { code: "LI",  iso: "LIE", name: "Liechtenstein"},
    "LTU": { code: "LT",  iso: "LTU", name: "Lithuania"},
    "LUX": { code: "LU",  iso: "LUX", name: "Luxembourg"},
    "MAC": { code: "MO",  iso: "MAC", name: "Macao"},
    "MKD": { code: "MK",  iso: "MKD", name: "Macedonia"},
    "MDG": { code: "MG",  iso: "MDG", name: "Madagascar"},
    "MWI": { code: "MW",  iso: "MWI", name: "Malawi"},
    "MYS": { code: "MY",  iso: "MYS", name: "Malaysia"},
    "MDV": { code: "MV",  iso: "MDV", name: "Maldives"},
    "MLI": { code: "ML",  iso: "MLI", name: "Mali"},
    "MLT": { code: "MT",  iso: "MLT", name: "Malta"},
    "MHL": { code: "MH",  iso: "MHL", name: "Marshall Islands"},
    "MTQ": { code: "MQ",  iso: "MTQ", name: "Martinique"},
    "MRT": { code: "MR",  iso: "MRT", name: "Mauritania"},
    "MUS": { code: "MU",  iso: "MUS", name: "Mauritius"},
    "MYT": { code: "YT",  iso: "MYT", name: "Mayotte"},
    "MEX": { code: "MX",  iso: "MEX", name: "Mexico"},
    "FSM": { code: "FM",  iso: "FSM", name: "Micronesia"},
    "MDA": { code: "MD",  iso: "MDA", name: "Moldova"},
    "MCO": { code: "MC",  iso: "MCO", name: "Monaco"},
    "MNG": { code: "MN",  iso: "MNG", name: "Mongolia"},
    "MNE": { code: "ME",  iso: "MNE", name: "Montenegro"},
    "MSR": { code: "MS",  iso: "MSR", name: "Montserrat"},
    "MAR": { code: "MA",  iso: "MAR", name: "Morocco"},
    "MOZ": { code: "MZ",  iso: "MOZ", name: "Mozambique"},
    "MMR": { code: "MM",  iso: "MMR", name: "Myanmar"},
    "NAM": { code: "NA",  iso: "NAM", name: "Namibia"},
    "NRU": { code: "NR",  iso: "NRU", name: "Nauru"},
    "NPL": { code: "NP",  iso: "NPL", name: "Nepal"},
    "NLD": { code: "NL",  iso: "NLD", name: "Netherlands"},
    "ANT": { code: "AN",  iso: "ANT", name: "Netherlands Antilles"},
    "NCL": { code: "NC",  iso: "NCL", name: "New Caledonia"},
    "NZL": { code: "NZ",  iso: "NZL", name: "New Zealand"},
    "NIC": { code: "NI",  iso: "NIC", name: "Nicaragua"},
    "NER": { code: "NE",  iso: "NER", name: "Niger"},
    "NGA": { code: "NG",  iso: "NGA", name: "Nigeria"},
    "NIU": { code: "NU",  iso: "NIU", name: "Niue"},
    "NFK": { code: "NF",  iso: "NFK", name: "Norfolk Island"},
    "PRK": { code: "KP",  iso: "PRK", name: "North Korea"},
    "MNP": { code: "MP",  iso: "MNP", name: "Northern Mariana Islands"},
    "NOR": { code: "NO",  iso: "NOR", name: "Norway"},
    "OMN": { code: "OM",  iso: "OMN", name: "Oman"},
    "PAK": { code: "PK",  iso: "PAK", name: "Pakistan"},
    "PLW": { code: "PW",  iso: "PLW", name: "Palau"},
    "PSE": { code: "PS",  iso: "PSE", name: "Palestine"},
    "PAN": { code: "PA",  iso: "PAN", name: "Panama"},
    "PNG": { code: "PG",  iso: "PNG", name: "Papua New Guinea"},
    "PRY": { code: "PY",  iso: "PRY", name: "Paraguay"},
    "PER": { code: "PE",  iso: "PER", name: "Peru"},
    "PHL": { code: "PH",  iso: "PHL", name: "Philippines"},
    "PCN": { code: "PN",  iso: "PCN", name: "Pitcairn"},
    "POL": { code: "PL",  iso: "POL", name: "Poland"},
    "PRT": { code: "PT",  iso: "PRT", name: "Portugal"},
    "PRI": { code: "PR",  iso: "PRI", name: "Puerto Rico"},
    "QAT": { code: "QA",  iso: "QAT", name: "Qatar"},
    "REU": { code: "RE",  iso: "REU", name: "Reunion"},
    "ROU": { code: "RO",  iso: "ROU", name: "Romania"},
    "RUS": { code: "RU",  iso: "RUS", name: "Russia"},
    "RWA": { code: "RW",  iso: "RWA", name: "Rwanda"},
    "BLM": { code: "BL",  iso: "BLM", name: "Saint Barthélemy"},
    "SHN": { code: "SH",  iso: "SHN", name: "Saint Helena"},
    "KNA": { code: "KN",  iso: "KNA", name: "Saint Kitts And Nevis"},
    "LCA": { code: "LC",  iso: "LCA", name: "Saint Lucia"},
    "MAF": { code: "MF",  iso: "MAF", name: "Saint Martin"},
    "SPM": { code: "PM",  iso: "SPM", name: "Saint Pierre And Miquelon"},
    "VCT": { code: "VC",  iso: "VCT", name: "Saint Vincent And The Grenadines"},
    "WSM": { code: "WS",  iso: "WSM", name: "Samoa"},
    "SMR": { code: "SM",  iso: "SMR", name: "San Marino"},
    "STP": { code: "ST",  iso: "STP", name: "Sao Tome And Principe"},
    "SAU": { code: "SA",  iso: "SAU", name: "Saudi Arabia"},
    "SEN": { code: "SN",  iso: "SEN", name: "Senegal"},
    "SRB": { code: "RS",  iso: "SRB", name: "Serbia"},
    "SYC": { code: "SC",  iso: "SYC", name: "Seychelles"},
    "SLE": { code: "SL",  iso: "SLE", name: "Sierra Leone"},
    "SGP": { code: "SG",  iso: "SGP", name: "Singapore"},
    "SXM": { code: "SX",  iso: "SXM", name: "Sint Maarten (Dutch part)"},
    "SVK": { code: "SK",  iso: "SVK", name: "Slovakia"},
    "SVN": { code: "SI",  iso: "SVN", name: "Slovenia"},
    "SLB": { code: "SB",  iso: "SLB", name: "Solomon Islands"},
    "SOM": { code: "SO",  iso: "SOM", name: "Somalia"},
    "ZAF": { code: "ZA",  iso: "ZAF", name: "South Africa"},
    "SGS": { code: "GS",  iso: "SGS", name: "South Georgia And The South Sandwich Islands"},
    "KOR": { code: "KR",  iso: "KOR", name: "South Korea"},
    "SSD": { code: "SS",  iso: "SSD", name: "South Sudan"},
    "ESP": { code: "ES",  iso: "ESP", name: "Spain"},
    "LKA": { code: "LK",  iso: "LKA", name: "Sri Lanka"},
    "SDN": { code: "SD",  iso: "SDN", name: "Sudan"},
    "SUR": { code: "SR",  iso: "SUR", name: "Suriname"},
    "SJM": { code: "SJ",  iso: "SJM", name: "Svalbard And Jan Mayen"},
    "SWZ": { code: "SZ",  iso: "SWZ", name: "Swaziland"},
    "SWE": { code: "SE",  iso: "SWE", name: "Sweden"},
    "CHE": { code: "CH",  iso: "CHE", name: "Switzerland"},
    "SYR": { code: "SY",  iso: "SYR", name: "Syria"},
    "TWN": { code: "TW",  iso: "TWN", name: "Taiwan"},
    "TJK": { code: "TJ",  iso: "TJK", name: "Tajikistan"},
    "TZA": { code: "TZ",  iso: "TZA", name: "Tanzania"},
    "THA": { code: "TH",  iso: "THA", name: "Thailand"},
    "COD": { code: "CD",  iso: "COD", name: "The Democratic Republic Of Congo"},
    "TLS": { code: "TL",  iso: "TLS", name: "Timor-Leste"},
    "TGO": { code: "TG",  iso: "TGO", name: "Togo"},
    "TKL": { code: "TK",  iso: "TKL", name: "Tokelau"},
    "TON": { code: "TO",  iso: "TON", name: "Tonga"},
    "TTO": { code: "TT",  iso: "TTO", name: "Trinidad and Tobago"},
    "TUN": { code: "TN",  iso: "TUN", name: "Tunisia"},
    "TUR": { code: "TR",  iso: "TUR", name: "Turkey"},
    "TKM": { code: "TM",  iso: "TKM", name: "Turkmenistan"},
    "TCA": { code: "TC",  iso: "TCA", name: "Turks And Caicos Islands"},
    "TUV": { code: "TV",  iso: "TUV", name: "Tuvalu"},
    "VIR": { code: "VI",  iso: "VIR", name: "U.S. Virgin Islands"},
    "UGA": { code: "UG",  iso: "UGA", name: "Uganda"},
    "UKR": { code: "UA",  iso: "UKR", name: "Ukraine"},
    "ARE": { code: "AE",  iso: "ARE", name: "United Arab Emirates"},
    "GBR": { code: "GB",  iso: "GBR", name: "United Kingdom"},
    "USA": { code: "US",  iso: "USA", name: "United States"},
    "UMI": { code: "UM",  iso: "UMI", name: "United States Minor Outlying Islands"},
    "URY": { code: "UY",  iso: "URY", name: "Uruguay"},
    "UZB": { code: "UZ",  iso: "UZB", name: "Uzbekistan"},
    "VUT": { code: "VU",  iso: "VUT", name: "Vanuatu"},
    "VAT": { code: "VA",  iso: "VAT", name: "Vatican"},
    "VEN": { code: "VE",  iso: "VEN", name: "Venezuela"},
    "VNM": { code: "VN",  iso: "VNM", name: "Vietnam"},
    "WLF": { code: "WF",  iso: "WLF", name: "Wallis And Futuna"},
    "ESH": { code: "EH",  iso: "ESH", name: "Western Sahara"},
    "YEM": { code: "YE",  iso: "YEM", name: "Yemen"},
    "ZMB": { code: "ZM",  iso: "ZMB", name: "Zambia"},
    "ZWE": { code: "ZW",  iso: "ZWE", name: "Zimbabwe"},
    "ALA": { code: "AX",  iso: "ALA", name: "Åland Islands"}
};


  constructor() { }

  /**
   * Gets a list of country objects
   * @returns country objects
   */
  getCountryListObjects() {
    return Object.values(this.countryList);
  }

  /**
   * Gets country object by its iso
   * 
   * @param countryIso
   * @returns country object
   */
  getCountryObjectByIso(countryIso: string){
    return this.countryList[countryIso];  
  }

  /**
   * Receives a country iso and returns its name
   * 
   * @param countryIso 
   * @returns string
   */
  getCountryNameByCountryIso(countryIso : string){
    var countryObject = this.countryList[countryIso];
    if (countryObject === undefined){
      return "-";
    } else {
      return countryObject.name;
    }
  }

  /**
   * Turns a timestamp into a date
   * 
   * @param timestamp 
   * @returns date
   */
  getReadableTime(timestamp) {
    var date = new Date(timestamp);
    return date.toLocaleString('en-GB', { hour12: false });
  }

  /**
   * Receives a day and returns the limits of the respective week
   * 
   * @param selectedDate day 
   * @returns object with first day and last day difference days
   */
  getWeekLimitsByWeekDay(selectedDate){
    selectedDate.set({"hour": 0, "minute": 0, "second": 0, "millisecond": 0});

    var selectedDay = selectedDate.day();

    var numDaysToSubtract;
    var numDaysToSum;

    if (selectedDay === 0){
      numDaysToSubtract = 6;
      numDaysToSum = 0;
    } else {
      numDaysToSubtract = selectedDay - 1;
      numDaysToSum = 7 - selectedDay;
    }
    var firstDay = selectedDate.clone();
    var lastDay = selectedDate.clone();

    lastDay.add({'days' : numDaysToSum});
    firstDay.add({'days' : -numDaysToSubtract});
    lastDay.set({"hour": 23, "minute": 59, "second": 59, "millisecond": 999});

    return {"firstDay": firstDay, "lastDay": lastDay};
  }

  /**
   * Returns the transport mode based on code
   * 
   * @param mode code of the transport
   * @returns mode name
   */
  getTransportModeName(mode){
    if (mode === null){
      return "Undefined";
    }
    switch (Number(mode)){
      case 0: return "Automotive";
      case 1: return "Cycling";
      case 3: return "Stationary";
      case 4: return "Unknown";
      case 7: return "Walking";
      case 8: return "Running";
      case 9: return "Car";  
      case 10: return "Train";  
      case 11: return "Tram";  
      case 12: return "Subway";   
      case 13: return "Ferry";   
      case 14: return "Plane";   
      case 15: return "Bus";
      case 16: return "Electric Bike";
      case 17: return "Bike Sharing";
      case 18: return "Micro Scooter";
      case 19: return "Skate";
      case 20: return "Motorcycle";
      case 21: return "Moped";
      case 22: return "Car Passenger";
      case 23: return "Taxi";
      case 24: return "Ride Hailing";
      case 25: return "Car Sharing";
      case 26: return "Car Pooling";
      case 27: return "Bus Long Distance";
      case 28: return "High Speed Train";
      case 29: return "Other";
      case 30: return "Other Public";
      case 31: return "Other Active";
      case 32: return "Other Private";
      case 33: return "Intercity Train";
      case 34: return "Wheel Chair";
      case 35: return "Cargo Bike";
      case 36: return "Car Sharing Passenger";
      case 37: return "Electric Wheel Chair";
    }
    return mode;
  }


}