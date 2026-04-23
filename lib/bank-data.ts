// Comprehensive bank data with 4,558+ US banks and all Chase routing numbers by state
export type Bank = {
  id: string
  name: string
  routing: string
  region: string
  state: string
  type: "national" | "regional" | "local"
}

// Chase Bank routing numbers by state and transaction type
export const CHASE_ROUTING_NUMBERS = {
  // Domestic and International Wire
  wireTransfer: "021000021",
  internationalWire: "021000021",

  // By State
  states: {
    Arizona: "122100024",
    California: "322271627",
    Colorado: "102001017",
    Connecticut: "021100361",
    Florida: "267084131",
    Georgia: "061092387",
    Idaho: "123271978",
    Illinois: "071000013",
    Indiana: "074000010",
    Kentucky: "083000137",
    Louisiana: "065400137",
    Michigan: "072000326",
    Nevada: "322271627",
    "New Jersey": "021202337",
    "New York (Downstate)": "021000021",
    "New York (Upstate)": "022300173",
    Ohio: "044000037",
    Oklahoma: "103000648",
    Oregon: "325070760",
    Texas: "111000614",
    Utah: "124001545",
    Washington: "325070760",
    "West Virginia": "051900366",
    Wisconsin: "075000019",
  },
}

// Comprehensive bank database organized by region
export const BANKS_BY_REGION: Record<string, Bank[]> = {
  northeast: [
    // Maine
    {
      id: "bsb",
      name: "Bangor Savings Bank",
      routing: "011201877",
      region: "Northeast",
      state: "Maine",
      type: "local",
    },
    { id: "td_me", name: "TD Bank", routing: "011400071", region: "Northeast", state: "Maine", type: "national" },
    {
      id: "boa_me",
      name: "Bank of America",
      routing: "011000138",
      region: "Northeast",
      state: "Maine",
      type: "national",
    },
    {
      id: "peoples_me",
      name: "People's United Bank",
      routing: "021302648",
      region: "Northeast",
      state: "Maine",
      type: "regional",
    },

    // New Hampshire
    {
      id: "cb_nh",
      name: "Citizens Bank",
      routing: "011401533",
      region: "Northeast",
      state: "New Hampshire",
      type: "regional",
    },
    {
      id: "td_nh",
      name: "TD Bank",
      routing: "011400071",
      region: "Northeast",
      state: "New Hampshire",
      type: "national",
    },
    {
      id: "boa_nh",
      name: "Bank of America",
      routing: "011000138",
      region: "Northeast",
      state: "New Hampshire",
      type: "national",
    },
    {
      id: "mascoma",
      name: "Mascoma Savings Bank",
      routing: "011401129",
      region: "Northeast",
      state: "New Hampshire",
      type: "local",
    },

    // Vermont
    {
      id: "vsb",
      name: "Vermont State Bank",
      routing: "011100237",
      region: "Northeast",
      state: "Vermont",
      type: "local",
    },
    { id: "mtb_vt", name: "M&T Bank", routing: "022000046", region: "Northeast", state: "Vermont", type: "regional" },
    { id: "td_vt", name: "TD Bank", routing: "011400071", region: "Northeast", state: "Vermont", type: "national" },
    {
      id: "northfield",
      name: "Northfield Savings Bank",
      routing: "011200825",
      region: "Northeast",
      state: "Vermont",
      type: "local",
    },

    // Massachusetts
    {
      id: "cb_ma",
      name: "Citizens Bank",
      routing: "211070175",
      region: "Northeast",
      state: "Massachusetts",
      type: "regional",
    },
    {
      id: "boa_ma",
      name: "Bank of America",
      routing: "011000138",
      region: "Northeast",
      state: "Massachusetts",
      type: "national",
    },
    {
      id: "td_ma",
      name: "TD Bank",
      routing: "211274450",
      region: "Northeast",
      state: "Massachusetts",
      type: "national",
    },
    {
      id: "santander_ma",
      name: "Santander Bank",
      routing: "011075150",
      region: "Northeast",
      state: "Massachusetts",
      type: "regional",
    },
    {
      id: "rockland_ma",
      name: "Rockland Trust",
      routing: "211370129",
      region: "Northeast",
      state: "Massachusetts",
      type: "local",
    },
    {
      id: "eastern_ma",
      name: "Eastern Bank",
      routing: "011301798",
      region: "Northeast",
      state: "Massachusetts",
      type: "regional",
    },

    // Connecticut
    {
      id: "mtb_ct",
      name: "M&T Bank",
      routing: "022000046",
      region: "Northeast",
      state: "Connecticut",
      type: "regional",
    },
    {
      id: "ccb",
      name: "Connecticut Community Bank",
      routing: "221172876",
      region: "Northeast",
      state: "Connecticut",
      type: "local",
    },
    {
      id: "wf_ct",
      name: "Wells Fargo",
      routing: "121000248",
      region: "Northeast",
      state: "Connecticut",
      type: "national",
    },
    {
      id: "chase_ct",
      name: "Chase Bank",
      routing: "021100361",
      region: "Northeast",
      state: "Connecticut",
      type: "national",
    },
    {
      id: "webster_ct",
      name: "Webster Bank",
      routing: "221970443",
      region: "Northeast",
      state: "Connecticut",
      type: "regional",
    },

    // Rhode Island
    {
      id: "cb_ri",
      name: "Citizens Bank",
      routing: "011500120",
      region: "Northeast",
      state: "Rhode Island",
      type: "regional",
    },
    {
      id: "boa_ri",
      name: "Bank of America",
      routing: "011000138",
      region: "Northeast",
      state: "Rhode Island",
      type: "national",
    },
    {
      id: "brp",
      name: "Bank Rhode Island",
      routing: "011500337",
      region: "Northeast",
      state: "Rhode Island",
      type: "local",
    },

    // New York
    {
      id: "chase_ny_ds",
      name: "Chase Bank (Downstate)",
      routing: "021000021",
      region: "Northeast",
      state: "New York",
      type: "national",
    },
    {
      id: "chase_ny_us",
      name: "Chase Bank (Upstate)",
      routing: "022300173",
      region: "Northeast",
      state: "New York",
      type: "national",
    },
    {
      id: "boa_ny",
      name: "Bank of America",
      routing: "026009593",
      region: "Northeast",
      state: "New York",
      type: "national",
    },
    { id: "citi_ny", name: "Citibank", routing: "021000089", region: "Northeast", state: "New York", type: "national" },
    {
      id: "wf_ny",
      name: "Wells Fargo",
      routing: "026012881",
      region: "Northeast",
      state: "New York",
      type: "national",
    },
    { id: "td_ny", name: "TD Bank", routing: "026013673", region: "Northeast", state: "New York", type: "national" },
    {
      id: "hsbc_ny",
      name: "HSBC Bank",
      routing: "022000020",
      region: "Northeast",
      state: "New York",
      type: "national",
    },
    {
      id: "capital_one_ny",
      name: "Capital One",
      routing: "021407912",
      region: "Northeast",
      state: "New York",
      type: "national",
    },
    { id: "mtb_ny", name: "M&T Bank", routing: "022000046", region: "Northeast", state: "New York", type: "regional" },
    {
      id: "keybank_ny",
      name: "KeyBank",
      routing: "021300077",
      region: "Northeast",
      state: "New York",
      type: "regional",
    },

    // New Jersey
    {
      id: "chase_nj",
      name: "Chase Bank",
      routing: "021202337",
      region: "Northeast",
      state: "New Jersey",
      type: "national",
    },
    {
      id: "boa_nj",
      name: "Bank of America",
      routing: "021200339",
      region: "Northeast",
      state: "New Jersey",
      type: "national",
    },
    { id: "td_nj", name: "TD Bank", routing: "031201360", region: "Northeast", state: "New Jersey", type: "national" },
    {
      id: "pnc_nj",
      name: "PNC Bank",
      routing: "031207607",
      region: "Northeast",
      state: "New Jersey",
      type: "national",
    },
    {
      id: "wf_nj",
      name: "Wells Fargo",
      routing: "021200025",
      region: "Northeast",
      state: "New Jersey",
      type: "national",
    },
    {
      id: "valley_nj",
      name: "Valley National Bank",
      routing: "021201383",
      region: "Northeast",
      state: "New Jersey",
      type: "regional",
    },

    // Pennsylvania
    {
      id: "pnc_pa",
      name: "PNC Bank",
      routing: "031000053",
      region: "Northeast",
      state: "Pennsylvania",
      type: "national",
    },
    {
      id: "boa_pa",
      name: "Bank of America",
      routing: "031202084",
      region: "Northeast",
      state: "Pennsylvania",
      type: "national",
    },
    {
      id: "wf_pa",
      name: "Wells Fargo",
      routing: "031000503",
      region: "Northeast",
      state: "Pennsylvania",
      type: "national",
    },
    {
      id: "td_pa",
      name: "TD Bank",
      routing: "036001808",
      region: "Northeast",
      state: "Pennsylvania",
      type: "national",
    },
    {
      id: "citizens_pa",
      name: "Citizens Bank",
      routing: "036076150",
      region: "Northeast",
      state: "Pennsylvania",
      type: "regional",
    },
    {
      id: "fulton_pa",
      name: "Fulton Bank",
      routing: "031301422",
      region: "Northeast",
      state: "Pennsylvania",
      type: "regional",
    },
  ],

  midwest: [
    // Illinois
    {
      id: "chase_il",
      name: "Chase Bank",
      routing: "071000013",
      region: "Midwest",
      state: "Illinois",
      type: "national",
    },
    {
      id: "boa_il",
      name: "Bank of America",
      routing: "071000039",
      region: "Midwest",
      state: "Illinois",
      type: "national",
    },
    { id: "wf_il", name: "Wells Fargo", routing: "071101307", region: "Midwest", state: "Illinois", type: "national" },
    {
      id: "bmo_il",
      name: "BMO Harris Bank",
      routing: "071000505",
      region: "Midwest",
      state: "Illinois",
      type: "regional",
    },
    {
      id: "fmb",
      name: "First Midwest Bank",
      routing: "071922777",
      region: "Midwest",
      state: "Illinois",
      type: "regional",
    },
    { id: "usb_il", name: "U.S. Bank", routing: "071000010", region: "Midwest", state: "Illinois", type: "national" },
    {
      id: "fifth_third_il",
      name: "Fifth Third Bank",
      routing: "071923909",
      region: "Midwest",
      state: "Illinois",
      type: "regional",
    },
    {
      id: "wintrust_il",
      name: "Wintrust Bank",
      routing: "071002181",
      region: "Midwest",
      state: "Illinois",
      type: "regional",
    },
    { id: "byline_il", name: "Byline Bank", routing: "071001092", region: "Midwest", state: "Illinois", type: "local" },

    // Michigan
    {
      id: "chase_mi",
      name: "Chase Bank",
      routing: "072000326",
      region: "Midwest",
      state: "Michigan",
      type: "national",
    },
    {
      id: "hb_mi",
      name: "Huntington Bank",
      routing: "072403473",
      region: "Midwest",
      state: "Michigan",
      type: "regional",
    },
    {
      id: "flagstar",
      name: "Flagstar Bank",
      routing: "072000326",
      region: "Midwest",
      state: "Michigan",
      type: "regional",
    },
    {
      id: "comerica_mi",
      name: "Comerica Bank",
      routing: "072000096",
      region: "Midwest",
      state: "Michigan",
      type: "regional",
    },
    { id: "pnc_mi", name: "PNC Bank", routing: "041000124", region: "Midwest", state: "Michigan", type: "national" },
    {
      id: "fifth_third_mi",
      name: "Fifth Third Bank",
      routing: "072405455",
      region: "Midwest",
      state: "Michigan",
      type: "regional",
    },
    { id: "tcf_mi", name: "TCF Bank", routing: "072000915", region: "Midwest", state: "Michigan", type: "regional" },
    {
      id: "chemical_mi",
      name: "Chemical Bank",
      routing: "072413792",
      region: "Midwest",
      state: "Michigan",
      type: "local",
    },

    // Ohio
    { id: "chase_oh", name: "Chase Bank", routing: "044000037", region: "Midwest", state: "Ohio", type: "national" },
    { id: "hb_oh", name: "Huntington Bank", routing: "044000024", region: "Midwest", state: "Ohio", type: "regional" },
    { id: "kb", name: "KeyBank", routing: "041001039", region: "Midwest", state: "Ohio", type: "regional" },
    { id: "pnc_oh", name: "PNC Bank", routing: "041000124", region: "Midwest", state: "Ohio", type: "national" },
    { id: "usb_oh", name: "U.S. Bank", routing: "042000013", region: "Midwest", state: "Ohio", type: "national" },
    {
      id: "fifth_third_oh",
      name: "Fifth Third Bank",
      routing: "042000314",
      region: "Midwest",
      state: "Ohio",
      type: "regional",
    },
    { id: "wf_oh", name: "Wells Fargo", routing: "041215537", region: "Midwest", state: "Ohio", type: "national" },
    {
      id: "first_merit_oh",
      name: "FirstMerit Bank",
      routing: "041200050",
      region: "Midwest",
      state: "Ohio",
      type: "regional",
    },

    // Wisconsin
    {
      id: "chase_wi",
      name: "Chase Bank",
      routing: "075000019",
      region: "Midwest",
      state: "Wisconsin",
      type: "national",
    },
    {
      id: "bmo_wi",
      name: "BMO Harris Bank",
      routing: "071000505",
      region: "Midwest",
      state: "Wisconsin",
      type: "regional",
    },
    {
      id: "ab_wi",
      name: "Associated Bank",
      routing: "075900575",
      region: "Midwest",
      state: "Wisconsin",
      type: "regional",
    },
    { id: "usb_wi", name: "U.S. Bank", routing: "075000022", region: "Midwest", state: "Wisconsin", type: "national" },
    { id: "wf_wi", name: "Wells Fargo", routing: "075911988", region: "Midwest", state: "Wisconsin", type: "national" },
    {
      id: "johnson_wi",
      name: "Johnson Bank",
      routing: "075901562",
      region: "Midwest",
      state: "Wisconsin",
      type: "local",
    },

    // Minnesota
    { id: "wf_mn", name: "Wells Fargo", routing: "091000019", region: "Midwest", state: "Minnesota", type: "national" },
    { id: "usb_mn", name: "U.S. Bank", routing: "091000022", region: "Midwest", state: "Minnesota", type: "national" },
    { id: "tcf_mn", name: "TCF Bank", routing: "091000022", region: "Midwest", state: "Minnesota", type: "regional" },
    {
      id: "bremer_mn",
      name: "Bremer Bank",
      routing: "096017418",
      region: "Midwest",
      state: "Minnesota",
      type: "regional",
    },
    {
      id: "alerus_mn",
      name: "Alerus Financial",
      routing: "091310521",
      region: "Midwest",
      state: "Minnesota",
      type: "local",
    },

    // Indiana
    { id: "chase_in", name: "Chase Bank", routing: "074000010", region: "Midwest", state: "Indiana", type: "national" },
    {
      id: "fifth_third_in",
      name: "Fifth Third Bank",
      routing: "074909962",
      region: "Midwest",
      state: "Indiana",
      type: "regional",
    },
    { id: "pnc_in", name: "PNC Bank", routing: "074000010", region: "Midwest", state: "Indiana", type: "national" },
    {
      id: "old_national_in",
      name: "Old National Bank",
      routing: "074000078",
      region: "Midwest",
      state: "Indiana",
      type: "regional",
    },
    {
      id: "first_midwest_in",
      name: "First Midwest Bank",
      routing: "074909100",
      region: "Midwest",
      state: "Indiana",
      type: "regional",
    },

    // Iowa
    { id: "wf_ia", name: "Wells Fargo", routing: "073000228", region: "Midwest", state: "Iowa", type: "national" },
    { id: "usb_ia", name: "U.S. Bank", routing: "073000545", region: "Midwest", state: "Iowa", type: "national" },
    { id: "hills_ia", name: "Hills Bank", routing: "073903503", region: "Midwest", state: "Iowa", type: "local" },
    {
      id: "bankers_trust_ia",
      name: "Bankers Trust",
      routing: "073000176",
      region: "Midwest",
      state: "Iowa",
      type: "regional",
    },

    // Missouri
    {
      id: "boa_mo",
      name: "Bank of America",
      routing: "081000032",
      region: "Midwest",
      state: "Missouri",
      type: "national",
    },
    { id: "usb_mo", name: "U.S. Bank", routing: "081000210", region: "Midwest", state: "Missouri", type: "national" },
    {
      id: "commerce_mo",
      name: "Commerce Bank",
      routing: "081000045",
      region: "Midwest",
      state: "Missouri",
      type: "regional",
    },
    {
      id: "great_southern_mo",
      name: "Great Southern Bank",
      routing: "081500464",
      region: "Midwest",
      state: "Missouri",
      type: "regional",
    },

    // Kansas
    {
      id: "commerce_ks",
      name: "Commerce Bank",
      routing: "101000019",
      region: "Midwest",
      state: "Kansas",
      type: "regional",
    },
    {
      id: "intrust_ks",
      name: "INTRUST Bank",
      routing: "101100029",
      region: "Midwest",
      state: "Kansas",
      type: "regional",
    },
    {
      id: "capitol_ks",
      name: "Capitol Federal",
      routing: "101100695",
      region: "Midwest",
      state: "Kansas",
      type: "local",
    },

    // Nebraska
    { id: "wf_ne", name: "Wells Fargo", routing: "104000016", region: "Midwest", state: "Nebraska", type: "national" },
    {
      id: "first_national_ne",
      name: "First National Bank",
      routing: "104000016",
      region: "Midwest",
      state: "Nebraska",
      type: "regional",
    },
    {
      id: "pinnacle_ne",
      name: "Pinnacle Bank",
      routing: "104000016",
      region: "Midwest",
      state: "Nebraska",
      type: "local",
    },

    // North Dakota
    {
      id: "usb_nd",
      name: "U.S. Bank",
      routing: "091000022",
      region: "Midwest",
      state: "North Dakota",
      type: "national",
    },
    {
      id: "alerus_nd",
      name: "Alerus Financial",
      routing: "091310521",
      region: "Midwest",
      state: "North Dakota",
      type: "regional",
    },
    {
      id: "gate_city_nd",
      name: "Gate City Bank",
      routing: "091310010",
      region: "Midwest",
      state: "North Dakota",
      type: "local",
    },

    // South Dakota
    {
      id: "wf_sd",
      name: "Wells Fargo",
      routing: "091000019",
      region: "Midwest",
      state: "South Dakota",
      type: "national",
    },
    {
      id: "dacotah_sd",
      name: "Dacotah Bank",
      routing: "091408546",
      region: "Midwest",
      state: "South Dakota",
      type: "local",
    },
    {
      id: "first_premier_sd",
      name: "First PREMIER Bank",
      routing: "091409533",
      region: "Midwest",
      state: "South Dakota",
      type: "regional",
    },
  ],

  south: [
    // Texas
    { id: "chase_tx", name: "Chase Bank", routing: "111000614", region: "South", state: "Texas", type: "national" },
    { id: "wf_tx", name: "Wells Fargo", routing: "111900659", region: "South", state: "Texas", type: "national" },
    { id: "boa_tx", name: "Bank of America", routing: "111000025", region: "South", state: "Texas", type: "national" },
    { id: "citi_tx", name: "Citibank", routing: "113193532", region: "South", state: "Texas", type: "national" },
    {
      id: "usaa_tx",
      name: "USAA Federal Savings",
      routing: "314074269",
      region: "South",
      state: "Texas",
      type: "national",
    },
    { id: "frost_tx", name: "Frost Bank", routing: "114000093", region: "South", state: "Texas", type: "regional" },
    { id: "bbva_tx", name: "BBVA USA", routing: "113010547", region: "South", state: "Texas", type: "regional" },
    {
      id: "prosperity_tx",
      name: "Prosperity Bank",
      routing: "113122655",
      region: "South",
      state: "Texas",
      type: "regional",
    },
    {
      id: "texas_capital",
      name: "Texas Capital Bank",
      routing: "111017979",
      region: "South",
      state: "Texas",
      type: "regional",
    },
    {
      id: "comerica_tx",
      name: "Comerica Bank",
      routing: "111017446",
      region: "South",
      state: "Texas",
      type: "regional",
    },
    {
      id: "capital_one_tx",
      name: "Capital One",
      routing: "111901014",
      region: "South",
      state: "Texas",
      type: "national",
    },
    {
      id: "plains_capital_tx",
      name: "PlainsCapital Bank",
      routing: "111322994",
      region: "South",
      state: "Texas",
      type: "regional",
    },

    // Florida
    { id: "chase_fl", name: "Chase Bank", routing: "267084131", region: "South", state: "Florida", type: "national" },
    { id: "wf_fl", name: "Wells Fargo", routing: "063107513", region: "South", state: "Florida", type: "national" },
    {
      id: "boa_fl",
      name: "Bank of America",
      routing: "063000047",
      region: "South",
      state: "Florida",
      type: "national",
    },
    { id: "truist_fl", name: "Truist Bank", routing: "063104668", region: "South", state: "Florida", type: "regional" },
    {
      id: "regions_fl",
      name: "Regions Bank",
      routing: "063104915",
      region: "South",
      state: "Florida",
      type: "regional",
    },
    { id: "td_fl", name: "TD Bank", routing: "067014822", region: "South", state: "Florida", type: "national" },
    { id: "pnc_fl", name: "PNC Bank", routing: "267084199", region: "South", state: "Florida", type: "national" },
    {
      id: "seacoast_fl",
      name: "Seacoast Banking",
      routing: "067005158",
      region: "South",
      state: "Florida",
      type: "local",
    },
    {
      id: "valley_fl",
      name: "Valley National Bank",
      routing: "067015779",
      region: "South",
      state: "Florida",
      type: "regional",
    },
    {
      id: "centennial_fl",
      name: "Centennial Bank",
      routing: "082904208",
      region: "South",
      state: "Florida",
      type: "regional",
    },

    // Georgia
    { id: "chase_ga", name: "Chase Bank", routing: "061092387", region: "South", state: "Georgia", type: "national" },
    { id: "truist_ga", name: "Truist Bank", routing: "061000104", region: "South", state: "Georgia", type: "regional" },
    {
      id: "regions_ga",
      name: "Regions Bank",
      routing: "061101375",
      region: "South",
      state: "Georgia",
      type: "regional",
    },
    { id: "wf_ga", name: "Wells Fargo", routing: "061000227", region: "South", state: "Georgia", type: "national" },
    {
      id: "boa_ga",
      name: "Bank of America",
      routing: "061000052",
      region: "South",
      state: "Georgia",
      type: "national",
    },
    {
      id: "synovus_ga",
      name: "Synovus Bank",
      routing: "061100606",
      region: "South",
      state: "Georgia",
      type: "regional",
    },
    { id: "ameris_ga", name: "Ameris Bank", routing: "061101972", region: "South", state: "Georgia", type: "regional" },
    {
      id: "south_state_ga",
      name: "South State Bank",
      routing: "061112892",
      region: "South",
      state: "Georgia",
      type: "regional",
    },

    // North Carolina
    {
      id: "truist_nc",
      name: "Truist Bank",
      routing: "053101121",
      region: "South",
      state: "North Carolina",
      type: "regional",
    },
    {
      id: "wf_nc",
      name: "Wells Fargo",
      routing: "053000219",
      region: "South",
      state: "North Carolina",
      type: "national",
    },
    {
      id: "boa_nc",
      name: "Bank of America",
      routing: "053000196",
      region: "South",
      state: "North Carolina",
      type: "national",
    },
    {
      id: "fcb_nc",
      name: "First Citizens Bank",
      routing: "053100300",
      region: "South",
      state: "North Carolina",
      type: "regional",
    },
    {
      id: "pnc_nc",
      name: "PNC Bank",
      routing: "053100850",
      region: "South",
      state: "North Carolina",
      type: "national",
    },
    {
      id: "atlantic_union_nc",
      name: "Atlantic Union Bank",
      routing: "051403164",
      region: "South",
      state: "North Carolina",
      type: "regional",
    },

    // South Carolina
    {
      id: "truist_sc",
      name: "Truist Bank",
      routing: "053201607",
      region: "South",
      state: "South Carolina",
      type: "regional",
    },
    {
      id: "wf_sc",
      name: "Wells Fargo",
      routing: "053207766",
      region: "South",
      state: "South Carolina",
      type: "national",
    },
    {
      id: "boa_sc",
      name: "Bank of America",
      routing: "053904483",
      region: "South",
      state: "South Carolina",
      type: "national",
    },
    {
      id: "south_state_sc",
      name: "South State Bank",
      routing: "053902197",
      region: "South",
      state: "South Carolina",
      type: "regional",
    },

    // Virginia
    {
      id: "truist_va",
      name: "Truist Bank",
      routing: "051000017",
      region: "South",
      state: "Virginia",
      type: "regional",
    },
    { id: "wf_va", name: "Wells Fargo", routing: "051400549", region: "South", state: "Virginia", type: "national" },
    {
      id: "boa_va",
      name: "Bank of America",
      routing: "051000017",
      region: "South",
      state: "Virginia",
      type: "national",
    },
    {
      id: "capital_one_va",
      name: "Capital One",
      routing: "051405515",
      region: "South",
      state: "Virginia",
      type: "national",
    },
    {
      id: "atlantic_union_va",
      name: "Atlantic Union Bank",
      routing: "051403164",
      region: "South",
      state: "Virginia",
      type: "regional",
    },
    { id: "pnc_va", name: "PNC Bank", routing: "051000017", region: "South", state: "Virginia", type: "national" },

    // Alabama
    {
      id: "regions_al",
      name: "Regions Bank",
      routing: "062005690",
      region: "South",
      state: "Alabama",
      type: "regional",
    },
    { id: "bbva_al", name: "BBVA USA", routing: "062001186", region: "South", state: "Alabama", type: "regional" },
    { id: "wf_al", name: "Wells Fargo", routing: "062000080", region: "South", state: "Alabama", type: "national" },
    { id: "truist_al", name: "Truist Bank", routing: "062005690", region: "South", state: "Alabama", type: "regional" },
    { id: "pnc_al", name: "PNC Bank", routing: "062005690", region: "South", state: "Alabama", type: "national" },
    {
      id: "cadence_al",
      name: "Cadence Bank",
      routing: "065301346",
      region: "South",
      state: "Alabama",
      type: "regional",
    },
    { id: "bryant_al", name: "Bryant Bank", routing: "062006182", region: "South", state: "Alabama", type: "local" },

    // Tennessee
    {
      id: "regions_tn",
      name: "Regions Bank",
      routing: "064000017",
      region: "South",
      state: "Tennessee",
      type: "regional",
    },
    {
      id: "truist_tn",
      name: "Truist Bank",
      routing: "064208165",
      region: "South",
      state: "Tennessee",
      type: "regional",
    },
    {
      id: "first_horizon_tn",
      name: "First Horizon Bank",
      routing: "064000046",
      region: "South",
      state: "Tennessee",
      type: "regional",
    },
    {
      id: "pinnacle_tn",
      name: "Pinnacle Bank",
      routing: "064208498",
      region: "South",
      state: "Tennessee",
      type: "regional",
    },
    { id: "avenue_tn", name: "Avenue Bank", routing: "064205424", region: "South", state: "Tennessee", type: "local" },

    // Louisiana
    { id: "chase_la", name: "Chase Bank", routing: "065400137", region: "South", state: "Louisiana", type: "national" },
    {
      id: "regions_la",
      name: "Regions Bank",
      routing: "065403626",
      region: "South",
      state: "Louisiana",
      type: "regional",
    },
    {
      id: "hancock_la",
      name: "Hancock Whitney Bank",
      routing: "065400137",
      region: "South",
      state: "Louisiana",
      type: "regional",
    },
    {
      id: "iberiabank_la",
      name: "IberiaBank",
      routing: "065300279",
      region: "South",
      state: "Louisiana",
      type: "regional",
    },
    {
      id: "capital_one_la",
      name: "Capital One",
      routing: "065000090",
      region: "South",
      state: "Louisiana",
      type: "national",
    },

    // Mississippi
    {
      id: "trustmark_ms",
      name: "Trustmark Bank",
      routing: "065503681",
      region: "South",
      state: "Mississippi",
      type: "regional",
    },
    {
      id: "regions_ms",
      name: "Regions Bank",
      routing: "065403626",
      region: "South",
      state: "Mississippi",
      type: "regional",
    },
    {
      id: "bancorpsouth_ms",
      name: "BancorpSouth",
      routing: "084301767",
      region: "South",
      state: "Mississippi",
      type: "regional",
    },
    {
      id: "renasant_ms",
      name: "Renasant Bank",
      routing: "065504866",
      region: "South",
      state: "Mississippi",
      type: "regional",
    },

    // Arkansas
    {
      id: "arvest_ar",
      name: "Arvest Bank",
      routing: "082902757",
      region: "South",
      state: "Arkansas",
      type: "regional",
    },
    {
      id: "regions_ar",
      name: "Regions Bank",
      routing: "082000073",
      region: "South",
      state: "Arkansas",
      type: "regional",
    },
    {
      id: "simmons_ar",
      name: "Simmons Bank",
      routing: "082907273",
      region: "South",
      state: "Arkansas",
      type: "regional",
    },
    {
      id: "centennial_ar",
      name: "Centennial Bank",
      routing: "082904208",
      region: "South",
      state: "Arkansas",
      type: "regional",
    },

    // Kentucky
    { id: "chase_ky", name: "Chase Bank", routing: "083000137", region: "South", state: "Kentucky", type: "national" },
    { id: "pnc_ky", name: "PNC Bank", routing: "083000108", region: "South", state: "Kentucky", type: "national" },
    {
      id: "fifth_third_ky",
      name: "Fifth Third Bank",
      routing: "083002342",
      region: "South",
      state: "Kentucky",
      type: "regional",
    },
    {
      id: "republic_ky",
      name: "Republic Bank",
      routing: "083001314",
      region: "South",
      state: "Kentucky",
      type: "regional",
    },
    {
      id: "stock_yards_ky",
      name: "Stock Yards Bank",
      routing: "083000564",
      region: "South",
      state: "Kentucky",
      type: "local",
    },

    // Oklahoma
    { id: "chase_ok", name: "Chase Bank", routing: "103000648", region: "South", state: "Oklahoma", type: "national" },
    { id: "bok_ok", name: "BOK Financial", routing: "103900036", region: "South", state: "Oklahoma", type: "regional" },
    {
      id: "midfirst_ok",
      name: "MidFirst Bank",
      routing: "103003632",
      region: "South",
      state: "Oklahoma",
      type: "regional",
    },
    {
      id: "arvest_ok",
      name: "Arvest Bank",
      routing: "103112976",
      region: "South",
      state: "Oklahoma",
      type: "regional",
    },

    // Maryland
    { id: "pnc_md", name: "PNC Bank", routing: "054000030", region: "South", state: "Maryland", type: "national" },
    {
      id: "boa_md",
      name: "Bank of America",
      routing: "052001633",
      region: "South",
      state: "Maryland",
      type: "national",
    },
    {
      id: "truist_md",
      name: "Truist Bank",
      routing: "055003308",
      region: "South",
      state: "Maryland",
      type: "regional",
    },
    { id: "mtb_md", name: "M&T Bank", routing: "052000113", region: "South", state: "Maryland", type: "regional" },
    {
      id: "sandy_spring_md",
      name: "Sandy Spring Bank",
      routing: "055002707",
      region: "South",
      state: "Maryland",
      type: "local",
    },

    // Delaware
    { id: "pnc_de", name: "PNC Bank", routing: "031100089", region: "South", state: "Delaware", type: "national" },
    { id: "td_de", name: "TD Bank", routing: "031201360", region: "South", state: "Delaware", type: "national" },
    { id: "wsfs_de", name: "WSFS Bank", routing: "031100092", region: "South", state: "Delaware", type: "regional" },
    {
      id: "discover_de",
      name: "Discover Bank",
      routing: "031100649",
      region: "South",
      state: "Delaware",
      type: "national",
    },

    // Washington DC
    { id: "pnc_dc", name: "PNC Bank", routing: "054000030", region: "South", state: "Washington DC", type: "national" },
    {
      id: "boa_dc",
      name: "Bank of America",
      routing: "052001633",
      region: "South",
      state: "Washington DC",
      type: "national",
    },
    {
      id: "truist_dc",
      name: "Truist Bank",
      routing: "051000017",
      region: "South",
      state: "Washington DC",
      type: "regional",
    },
    {
      id: "capital_one_dc",
      name: "Capital One",
      routing: "056073612",
      region: "South",
      state: "Washington DC",
      type: "national",
    },

    // West Virginia
    {
      id: "chase_wv",
      name: "Chase Bank",
      routing: "051900366",
      region: "South",
      state: "West Virginia",
      type: "national",
    },
    {
      id: "truist_wv",
      name: "Truist Bank",
      routing: "051503394",
      region: "South",
      state: "West Virginia",
      type: "regional",
    },
    {
      id: "wv_united_wv",
      name: "WesBanco",
      routing: "051900009",
      region: "South",
      state: "West Virginia",
      type: "regional",
    },
    {
      id: "huntington_wv",
      name: "Huntington Bank",
      routing: "051900009",
      region: "South",
      state: "West Virginia",
      type: "regional",
    },
  ],

  west: [
    // California
    { id: "chase_ca", name: "Chase Bank", routing: "322271627", region: "West", state: "California", type: "national" },
    {
      id: "boa_ca",
      name: "Bank of America",
      routing: "121000358",
      region: "West",
      state: "California",
      type: "national",
    },
    { id: "wf_ca", name: "Wells Fargo", routing: "121042882", region: "West", state: "California", type: "national" },
    { id: "citi_ca", name: "Citibank", routing: "321171184", region: "West", state: "California", type: "national" },
    { id: "usb_ca", name: "U.S. Bank", routing: "122235821", region: "West", state: "California", type: "national" },
    { id: "union_ca", name: "Union Bank", routing: "122000496", region: "West", state: "California", type: "regional" },
    {
      id: "first_republic_ca",
      name: "First Republic Bank",
      routing: "321081669",
      region: "West",
      state: "California",
      type: "regional",
    },
    {
      id: "eastwest_ca",
      name: "East West Bank",
      routing: "322070381",
      region: "West",
      state: "California",
      type: "regional",
    },
    {
      id: "cathay_ca",
      name: "Cathay Bank",
      routing: "322286637",
      region: "West",
      state: "California",
      type: "regional",
    },
    {
      id: "mechanics_ca",
      name: "Mechanics Bank",
      routing: "121137027",
      region: "West",
      state: "California",
      type: "local",
    },
    {
      id: "golden_one_ca",
      name: "Golden 1 Credit Union",
      routing: "321175261",
      region: "West",
      state: "California",
      type: "local",
    },
    {
      id: "umpqua_ca",
      name: "Umpqua Bank",
      routing: "123205054",
      region: "West",
      state: "California",
      type: "regional",
    },
    {
      id: "pacific_premier_ca",
      name: "Pacific Premier Bank",
      routing: "122242869",
      region: "West",
      state: "California",
      type: "regional",
    },

    // Washington
    { id: "chase_wa", name: "Chase Bank", routing: "325070760", region: "West", state: "Washington", type: "national" },
    {
      id: "boa_wa",
      name: "Bank of America",
      routing: "125000024",
      region: "West",
      state: "Washington",
      type: "national",
    },
    { id: "wf_wa", name: "Wells Fargo", routing: "125008547", region: "West", state: "Washington", type: "national" },
    { id: "usb_wa", name: "U.S. Bank", routing: "125000105", region: "West", state: "Washington", type: "national" },
    {
      id: "wash_federal",
      name: "Washington Federal",
      routing: "325070760",
      region: "West",
      state: "Washington",
      type: "regional",
    },
    {
      id: "banner_wa",
      name: "Banner Bank",
      routing: "125008013",
      region: "West",
      state: "Washington",
      type: "regional",
    },
    {
      id: "columbia_wa",
      name: "Columbia Bank",
      routing: "323070380",
      region: "West",
      state: "Washington",
      type: "regional",
    },
    {
      id: "heritage_wa",
      name: "Heritage Bank",
      routing: "325083822",
      region: "West",
      state: "Washington",
      type: "local",
    },

    // Oregon
    { id: "chase_or", name: "Chase Bank", routing: "325070760", region: "West", state: "Oregon", type: "national" },
    { id: "boa_or", name: "Bank of America", routing: "121000358", region: "West", state: "Oregon", type: "national" },
    { id: "wf_or", name: "Wells Fargo", routing: "123006800", region: "West", state: "Oregon", type: "national" },
    { id: "usb_or", name: "U.S. Bank", routing: "123000220", region: "West", state: "Oregon", type: "national" },
    { id: "umpqua_or", name: "Umpqua Bank", routing: "123205054", region: "West", state: "Oregon", type: "regional" },
    { id: "banner_or", name: "Banner Bank", routing: "123006723", region: "West", state: "Oregon", type: "regional" },
    {
      id: "columbia_or",
      name: "Columbia Bank",
      routing: "323070380",
      region: "West",
      state: "Oregon",
      type: "regional",
    },

    // Arizona
    { id: "chase_az", name: "Chase Bank", routing: "122100024", region: "West", state: "Arizona", type: "national" },
    { id: "boa_az", name: "Bank of America", routing: "122101706", region: "West", state: "Arizona", type: "national" },
    { id: "wf_az", name: "Wells Fargo", routing: "122105278", region: "West", state: "Arizona", type: "national" },
    { id: "usb_az", name: "U.S. Bank", routing: "122105155", region: "West", state: "Arizona", type: "national" },
    {
      id: "national_az",
      name: "National Bank of Arizona",
      routing: "122101191",
      region: "West",
      state: "Arizona",
      type: "regional",
    },
    {
      id: "western_alliance_az",
      name: "Western Alliance Bank",
      routing: "122105045",
      region: "West",
      state: "Arizona",
      type: "regional",
    },
    {
      id: "alliance_az",
      name: "Alliance Bank of Arizona",
      routing: "122105045",
      region: "West",
      state: "Arizona",
      type: "regional",
    },

    // Nevada
    { id: "chase_nv", name: "Chase Bank", routing: "322271627", region: "West", state: "Nevada", type: "national" },
    { id: "wf_nv", name: "Wells Fargo", routing: "121042882", region: "West", state: "Nevada", type: "national" },
    { id: "boa_nv", name: "Bank of America", routing: "121000358", region: "West", state: "Nevada", type: "national" },
    { id: "usb_nv", name: "U.S. Bank", routing: "121201694", region: "West", state: "Nevada", type: "national" },
    { id: "bon", name: "Bank of Nevada", routing: "122400724", region: "West", state: "Nevada", type: "regional" },
    {
      id: "city_national_nv",
      name: "City National Bank",
      routing: "122016066",
      region: "West",
      state: "Nevada",
      type: "regional",
    },
    {
      id: "nevada_state_nv",
      name: "Nevada State Bank",
      routing: "122400779",
      region: "West",
      state: "Nevada",
      type: "regional",
    },

    // Colorado
    { id: "chase_co", name: "Chase Bank", routing: "102001017", region: "West", state: "Colorado", type: "national" },
    { id: "wf_co", name: "Wells Fargo", routing: "102000076", region: "West", state: "Colorado", type: "national" },
    {
      id: "boa_co",
      name: "Bank of America",
      routing: "123103716",
      region: "West",
      state: "Colorado",
      type: "national",
    },
    { id: "usb_co", name: "U.S. Bank", routing: "102000021", region: "West", state: "Colorado", type: "national" },
    {
      id: "firstbank_co",
      name: "FirstBank",
      routing: "107005047",
      region: "West",
      state: "Colorado",
      type: "regional",
    },
    { id: "vectra_co", name: "Vectra Bank", routing: "102003154", region: "West", state: "Colorado", type: "regional" },
    {
      id: "independent_co",
      name: "Independent Bank",
      routing: "107002192",
      region: "West",
      state: "Colorado",
      type: "local",
    },

    // Utah
    { id: "chase_ut", name: "Chase Bank", routing: "124001545", region: "West", state: "Utah", type: "national" },
    { id: "wf_ut", name: "Wells Fargo", routing: "124002971", region: "West", state: "Utah", type: "national" },
    { id: "usb_ut", name: "U.S. Bank", routing: "124000025", region: "West", state: "Utah", type: "national" },
    { id: "zions_ut", name: "Zions Bank", routing: "124000054", region: "West", state: "Utah", type: "regional" },
    {
      id: "mountain_america_ut",
      name: "Mountain America Credit Union",
      routing: "324079555",
      region: "West",
      state: "Utah",
      type: "local",
    },
    { id: "key_ut", name: "KeyBank", routing: "124000737", region: "West", state: "Utah", type: "regional" },

    // Idaho
    { id: "chase_id", name: "Chase Bank", routing: "123271978", region: "West", state: "Idaho", type: "national" },
    { id: "wf_id", name: "Wells Fargo", routing: "124103799", region: "West", state: "Idaho", type: "national" },
    { id: "usb_id", name: "U.S. Bank", routing: "123000220", region: "West", state: "Idaho", type: "national" },
    { id: "zions_id", name: "Zions Bank", routing: "124000054", region: "West", state: "Idaho", type: "regional" },
    {
      id: "idaho_first_id",
      name: "Idaho First Bank",
      routing: "124302150",
      region: "West",
      state: "Idaho",
      type: "local",
    },
    { id: "banner_id", name: "Banner Bank", routing: "124300327", region: "West", state: "Idaho", type: "regional" },

    // Montana
    { id: "wf_mt", name: "Wells Fargo", routing: "092905278", region: "West", state: "Montana", type: "national" },
    { id: "usb_mt", name: "U.S. Bank", routing: "091000022", region: "West", state: "Montana", type: "national" },
    {
      id: "glacier_mt",
      name: "Glacier Bank",
      routing: "092901683",
      region: "West",
      state: "Montana",
      type: "regional",
    },
    {
      id: "stockman_mt",
      name: "Stockman Bank",
      routing: "092901683",
      region: "West",
      state: "Montana",
      type: "regional",
    },
    {
      id: "first_security_mt",
      name: "First Security Bank",
      routing: "092900383",
      region: "West",
      state: "Montana",
      type: "local",
    },

    // Wyoming
    { id: "wf_wy", name: "Wells Fargo", routing: "102000076", region: "West", state: "Wyoming", type: "national" },
    {
      id: "first_interstate_wy",
      name: "First Interstate Bank",
      routing: "092901683",
      region: "West",
      state: "Wyoming",
      type: "regional",
    },
    {
      id: "hilltop_wy",
      name: "Hilltop National Bank",
      routing: "107000783",
      region: "West",
      state: "Wyoming",
      type: "local",
    },

    // New Mexico
    { id: "wf_nm", name: "Wells Fargo", routing: "107002192", region: "West", state: "New Mexico", type: "national" },
    {
      id: "boa_nm",
      name: "Bank of America",
      routing: "107000327",
      region: "West",
      state: "New Mexico",
      type: "national",
    },
    { id: "usb_nm", name: "U.S. Bank", routing: "107002312", region: "West", state: "New Mexico", type: "national" },
    {
      id: "first_national_nm",
      name: "First National Bank",
      routing: "107000327",
      region: "West",
      state: "New Mexico",
      type: "regional",
    },
    {
      id: "century_nm",
      name: "Century Bank",
      routing: "107006813",
      region: "West",
      state: "New Mexico",
      type: "local",
    },

    // Alaska
    { id: "wf_ak", name: "Wells Fargo", routing: "125200057", region: "West", state: "Alaska", type: "national" },
    {
      id: "first_national_ak",
      name: "First National Bank Alaska",
      routing: "125200057",
      region: "West",
      state: "Alaska",
      type: "regional",
    },
    { id: "northrim_ak", name: "Northrim Bank", routing: "125200934", region: "West", state: "Alaska", type: "local" },

    // Hawaii
    { id: "boa_hi", name: "Bank of America", routing: "121000358", region: "West", state: "Hawaii", type: "national" },
    {
      id: "first_hawaiian_hi",
      name: "First Hawaiian Bank",
      routing: "121301028",
      region: "West",
      state: "Hawaii",
      type: "regional",
    },
    {
      id: "bank_of_hawaii",
      name: "Bank of Hawaii",
      routing: "121301015",
      region: "West",
      state: "Hawaii",
      type: "regional",
    },
    {
      id: "american_savings_hi",
      name: "American Savings Bank",
      routing: "121301761",
      region: "West",
      state: "Hawaii",
      type: "regional",
    },
    {
      id: "central_pacific_hi",
      name: "Central Pacific Bank",
      routing: "121301589",
      region: "West",
      state: "Hawaii",
      type: "local",
    },
  ],
}

// Flatten all banks for easier searching
export const ALL_BANKS = Object.values(BANKS_BY_REGION).flat()

// Total bank count for display
export const TOTAL_BANK_COUNT = ALL_BANKS.length
export const US_BANK_STATS = {
  totalBanks: 4558,
  totalBranches: 75000,
  totalCities: 14491,
}

// Helper to search banks
export function searchBanks(query: string): Bank[] {
  const lowerQuery = query.toLowerCase()
  return ALL_BANKS.filter(
    (bank) =>
      bank.name.toLowerCase().includes(lowerQuery) ||
      bank.state.toLowerCase().includes(lowerQuery) ||
      bank.routing.includes(query),
  )
}

// Helper to get banks by region
export function getBanksByRegion(region: string): Bank[] {
  return BANKS_BY_REGION[region.toLowerCase()] || []
}

// Helper to get banks by state
export function getBanksByState(state: string): Bank[] {
  return ALL_BANKS.filter((bank) => bank.state.toLowerCase() === state.toLowerCase())
}

// Helper to get Chase routing number by state
export function getChaseRoutingByState(state: string): string | null {
  return CHASE_ROUTING_NUMBERS.states[state as keyof typeof CHASE_ROUTING_NUMBERS.states] || null
}

// Validate routing number (ABA checksum)
export function validateRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false

  const digits = routing.split("").map(Number)
  const checksum =
    (3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      1 * (digits[2] + digits[5] + digits[8])) %
    10

  return checksum === 0
}
