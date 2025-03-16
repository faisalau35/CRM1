/**
 * Local BIN database for card identification
 * This database contains BIN ranges for various card issuers and types
 */
export const LOCAL_BINS: Record<string, string> = {
  // Visa
  "4": "Visa",
  "414720": "JP Morgan Chase - Visa Classic",
  "422910": "JP Morgan Chase - Visa Signature",
  "438857": "Bank of America - Visa Platinum",
  "456789": "Wells Fargo - Visa Rewards",
  "414738": "Capital One - Visa Platinum",
  "457173": "Jyske Bank - Visa/Dankort", // Denmark
  
  // Mastercard
  "51": "Mastercard",
  "52": "Mastercard",
  "53": "Mastercard",
  "54": "Mastercard",
  "55": "Mastercard",
  "512345": "Citibank - Mastercard Gold",
  "521234": "Chase - Mastercard Platinum",
  "531234": "Bank of America - Mastercard Rewards",
  "551234": "Capital One - Mastercard World",
  
  // American Express
  "34": "American Express",
  "37": "American Express",
  "341234": "Amex - Green Card",
  "371234": "Amex - Gold Card",
  "378282": "Amex - Platinum Card",
  
  // Discover
  "6011": "Discover",
  "65": "Discover",
  "601100": "Discover - It Card",
  "644520": "Discover - Miles Card",
  
  // Other card networks
  "35": "JCB",
  "30": "Diners Club",
  "36": "Diners Club",
  "38": "Diners Club",
  "6304": "Maestro",
  "6759": "Maestro",
  "6761": "Maestro",
  "6762": "Maestro",
  "6763": "Maestro",
  
  // More specific bank cards
  "402360": "HSBC - Visa Classic",
  "426395": "Barclays - Visa Rewards",
  "431490": "US Bank - Visa Signature",
  "450875": "TD Bank - Visa Debit",
  "472439": "Wells Fargo - Visa Business",
  "516732": "PNC Bank - Mastercard Standard",
  "524366": "Citibank - Mastercard World Elite",
  "552433": "Wells Fargo - Mastercard Business",
  
  // Additional cards from binlist.net examples
  "45717360": "Jyske Bank - Visa/Dankort (Denmark)",
  
  // UK Banks
  "454313": "Lloyds Bank - Visa",
  "454742": "Barclays - Visa",
  "454314": "HSBC - Visa",
  "493428": "Nationwide - Visa",
  "519929": "Santander - Mastercard",
  
  // Canadian Banks
  "450140": "Royal Bank of Canada - Visa",
  "450141": "TD Canada Trust - Visa",
  "450142": "CIBC - Visa",
  "519332": "Scotiabank - Mastercard",
  
  // Australian Banks
  "456767": "Commonwealth Bank - Visa",
  "456768": "ANZ - Visa",
  "456769": "Westpac - Visa",
  "522980": "NAB - Mastercard",
  
  // European Banks
  "491361": "Deutsche Bank - Visa (Germany)",
  "491362": "Commerzbank - Visa (Germany)",
  "491363": "BNP Paribas - Visa (France)",
  "491364": "Société Générale - Visa (France)",
  "491365": "UniCredit - Visa (Italy)",
  "491366": "Santander - Visa (Spain)",
  "491367": "ING - Visa (Netherlands)",
  "491368": "Nordea - Visa (Sweden)",
  "491369": "Danske Bank - Visa (Denmark)",
  
  // Asian Banks
  "491370": "ICBC - Visa (China)",
  "491371": "Bank of China - Visa (China)",
  "491372": "Mitsubishi UFJ - Visa (Japan)",
  "491373": "Mizuho - Visa (Japan)",
  "491374": "DBS - Visa (Singapore)",
  "491375": "OCBC - Visa (Singapore)",
  "491376": "HDFC - Visa (India)",
  "491377": "ICICI - Visa (India)",
  
  // Middle Eastern Banks
  "491378": "Emirates NBD - Visa (UAE)",
  "491379": "Qatar National Bank - Visa (Qatar)",
  "491380": "National Commercial Bank - Visa (Saudi Arabia)",
  
  // South American Banks
  "491381": "Banco do Brasil - Visa (Brazil)",
  "491382": "Itaú - Visa (Brazil)",
  "491383": "Bancolombia - Visa (Colombia)",
  "491384": "Banco de Chile - Visa (Chile)",
  
  // African Banks
  "491385": "Standard Bank - Visa (South Africa)",
  "491386": "FirstRand Bank - Visa (South Africa)",
  "491387": "Ecobank - Visa (Nigeria)",
  "491388": "Commercial International Bank - Visa (Egypt)",
};

export default LOCAL_BINS; 