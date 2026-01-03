// Sefaria API integration for Torah content

const SEFARIA_API_BASE = 'https://www.sefaria.org/api';

export interface SefariaText {
  ref: string;
  heRef: string;
  text: string | string[];
  he: string | string[];
  sectionRef?: string;
}

export interface SefariaLink {
  ref: string;
  heRef: string;
  category: string;
  sourceRef: string;
  sourceHeRef: string;
  anchorText?: string;
}

// Map Hebrew parsha names to Sefaria refs
const PARSHA_MAP: Record<string, string> = {
  'בראשית': 'Bereshit',
  'נח': 'Noach',
  'לך לך': 'Lech Lecha',
  'וירא': 'Vayera',
  'חיי שרה': 'Chayei Sara',
  'תולדות': 'Toldot',
  'ויצא': 'Vayetzei',
  'וישלח': 'Vayishlach',
  'וישב': 'Vayeshev',
  'מקץ': 'Miketz',
  'ויגש': 'Vayigash',
  'ויחי': 'Vayechi',
  'שמות': 'Shemot',
  'וארא': 'Vaera',
  'בא': 'Bo',
  'בשלח': 'Beshalach',
  'יתרו': 'Yitro',
  'משפטים': 'Mishpatim',
  'תרומה': 'Terumah',
  'תצוה': 'Tetzaveh',
  'כי תשא': 'Ki Tisa',
  'ויקהל': 'Vayakhel',
  'פקודי': 'Pekudei',
  'ויקרא': 'Vayikra',
  'צו': 'Tzav',
  'שמיני': 'Shmini',
  'תזריע': 'Tazria',
  'מצורע': 'Metzora',
  'אחרי מות': 'Achrei Mot',
  'קדושים': 'Kedoshim',
  'אמור': 'Emor',
  'בהר': 'Behar',
  'בחוקותי': 'Bechukotai',
  'במדבר': 'Bamidbar',
  'נשא': 'Nasso',
  'בהעלותך': 'Beha\'alotcha',
  'שלח': 'Sh\'lach',
  'קורח': 'Korach',
  'חוקת': 'Chukat',
  'בלק': 'Balak',
  'פינחס': 'Pinchas',
  'מטות': 'Matot',
  'מסעי': 'Masei',
  'דברים': 'Devarim',
  'ואתחנן': 'Vaetchanan',
  'עקב': 'Eikev',
  'ראה': 'Re\'eh',
  'שופטים': 'Shoftim',
  'כי תצא': 'Ki Teitzei',
  'כי תבוא': 'Ki Tavo',
  'ניצבים': 'Nitzavim',
  'וילך': 'Vayeilech',
  'האזינו': 'Ha\'azinu',
  'וזאת הברכה': 'V\'Zot HaBerachah',
};

/**
 * Get Sefaria ref from Hebrew parsha name
 */
export const getParshaRef = (hebrewName: string): string | null => {
  // Remove "פרשת" prefix if exists
  const cleanName = hebrewName.replace(/^פרשת\s*/, '').trim();
  return PARSHA_MAP[cleanName] || null;
};

/**
 * Fetch parsha text from Sefaria
 */
export const fetchParshaText = async (parshaName: string): Promise<SefariaText | null> => {
  try {
    const ref = getParshaRef(parshaName);
    if (!ref) {
      console.log('Could not find ref for parsha:', parshaName);
      return null;
    }

    const response = await fetch(`${SEFARIA_API_BASE}/texts/${encodeURIComponent(ref)}?context=0&pad=0`);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching parsha text:', error);
    return null;
  }
};

/**
 * Fetch related commentaries for a parsha
 */
export const fetchParshaCommentaries = async (parshaName: string): Promise<SefariaLink[]> => {
  try {
    const ref = getParshaRef(parshaName);
    if (!ref) return [];

    const response = await fetch(`${SEFARIA_API_BASE}/links/${encodeURIComponent(ref)}?with_text=0`);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }
    
    const links: SefariaLink[] = await response.json();
    
    // Filter to get main commentaries
    const commentaries = links.filter(link => 
      link.category === 'Commentary' || 
      link.category === 'Midrash' ||
      link.category === 'Targum'
    ).slice(0, 10); // Limit to 10 commentaries
    
    return commentaries;
  } catch (error) {
    console.error('Error fetching commentaries:', error);
    return [];
  }
};

/**
 * Fetch a specific text by reference
 */
export const fetchTextByRef = async (ref: string): Promise<SefariaText | null> => {
  try {
    const response = await fetch(`${SEFARIA_API_BASE}/texts/${encodeURIComponent(ref)}?context=0&pad=0`);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching text:', error);
    return null;
  }
};

/**
 * Get daily Daf Yomi
 */
export const fetchDafYomi = async (): Promise<{ ref: string; heRef: string } | null> => {
  try {
    const response = await fetch(`${SEFARIA_API_BASE}/calendars`);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }
    
    const data = await response.json();
    const dafYomi = data.calendar_items?.find((item: any) => item.title?.en === 'Daf Yomi');
    
    if (dafYomi) {
      return {
        ref: dafYomi.ref,
        heRef: dafYomi.displayValue?.he || dafYomi.ref,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Daf Yomi:', error);
    return null;
  }
};

/**
 * Get daily Halacha (from Shulchan Aruch or Mishna Berura)
 */
export const fetchDailyHalacha = async (): Promise<{ ref: string; heRef: string } | null> => {
  try {
    const response = await fetch(`${SEFARIA_API_BASE}/calendars`);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }
    
    const data = await response.json();
    const halacha = data.calendar_items?.find((item: any) => 
      item.title?.en === 'Daily Mishnah' || 
      item.title?.en === 'Daily Rambam'
    );
    
    if (halacha) {
      return {
        ref: halacha.ref,
        heRef: halacha.displayValue?.he || halacha.ref,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching daily halacha:', error);
    return null;
  }
};
