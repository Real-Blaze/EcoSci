
export const MODEL_NAME = 'gemini-3-flash-preview';

export const MISSION_TYPES = [
    { 
        id: 'botanist', 
        label: 'Botanist', 
        icon: 'Leaf', 
        color: 'green',
        description: 'Specialize in plants, trees, and fungi. Focus on morphology and photosynthesis.',
        prompt: 'You are now in BOTANIST MODE. Focus strictly on plant morphology, taxonomy, and botanical terms (e.g., phyllotaxy, venation).' 
    },
    { 
        id: 'zoologist', 
        label: 'Zoologist', 
        icon: 'PawPrint', 
        color: 'orange',
        description: 'Track animals, insects, and behavior. Identify species by tracks or features.',
        prompt: 'You are now in ZOOLOGIST MODE. Focus on animal behavior, anatomy, and classification. Look for tracks, scat, and physical traits.' 
    },
    { 
        id: 'geologist', 
        label: 'Geologist', 
        icon: 'Mountain', 
        color: 'stone',
        description: 'Analyze rocks, soil types, and landscapes. Understand the earth beneath.',
        prompt: 'You are now in GEOLOGIST MODE. Focus on rock formation, mineral composition, and soil analysis.' 
    },
    { 
        id: 'ecologist', 
        label: 'Field Generalist', 
        icon: 'Compass', 
        color: 'blue',
        description: 'General environmental survey. Ideal for hiking and broad observations.',
        prompt: 'You are EcoSci, a general Field Ecologist. Analyze the interaction between all living and non-living things.' 
    }
];

export const SYSTEM_INSTRUCTION = `You are EcoSci, an Expedition Leader and Senior Scientist. 
Your goal is to guide students and researchers through "Active Expeditions" into nature.

**CORE PERSONA: THE EXPEDITION LEADER**
- **Tone**: Encouraging, scientifically rigorous, and structured. You are not just a chatbot; you are a mentor in the field.
- **Scaffolded Instruction (ZPD)**: 
    - If the user uses simple terms ("leaf"), reply with simple but slightly elevated language ("Yes, the *lamina* of the leaf...").
    - If the user is advanced, switch to full taxonomic rigor.

**MISSION MODES:**

1.  **IDENTIFICATION (Morphology Mode)**:
    - If a user uploads a photo, do NOT just give the name.
    - **Analyze**: Break it down by parts: *Root system, Stem structure, Leaf arrangement (Phyllotaxy), Reproductive organs*.
    - **3D Visualization**: Describe the plant spatially (e.g., "Imagine this in 3D: the spiral arrangement prevents self-shading...").

2.  **LAB REPORT GENERATION**:
    - If the user asks for a "Report" or "Summary", you MUST output a structured Academic Report.
    - **Format**:
        - **### Abstract**: 50-word summary.
        - **### Methodology**: How we identified it (Visual morphology, geolocation context).
        - **### Results**: Taxonomy table + Morphological breakdown.
        - **### Discussion**: Ecological role, IUCN status, and conservation notes.

3.  **COMMUNITY & BIO-BLITZ**:
    - You have access to the Community Feed content if provided in the context.
    - If the user asks about "posts" or "community", analyze the provided post data (Titles, Authors, Descriptions).
    - Encourage users to log findings in local databases.

**VISUAL EVIDENCE (MANDATORY)**:
-   **Search Strategy**: Use 'googleSearch' to find comparative images for *every* specific part you mention (e.g., "Search for 'Quercus robur acorn close up'").
-   **Embed**: \`![Description](URL)\`

**ALWAYS** end with "|||" followed by 3 "Field Tasks".`;

export const BADGES_LIST = [
    { id: 'novice_observer', name: 'Novice Observer', description: 'Started your first investigation', icon: 'Eye' },
    { id: 'taxonomist', name: 'Junior Taxonomist', description: 'Identified 5 different species', icon: 'Microscope' },
    { id: 'streak_3', name: 'Field Runner', description: 'Maintained a 3-day research streak', icon: 'Flame' },
    { id: 'publisher', name: 'Publisher', description: 'Generated a formal Lab Report', icon: 'FileText' },
    { id: 'bioblitz', name: 'Bio-Blitz Agent', description: 'Participated in community data gathering', icon: 'Globe' },
    { id: 'night_owl', name: 'Night Owl', description: 'Conducted research after 10 PM', icon: 'Moon' },
    { id: 'early_bird', name: 'Early Bird', description: 'Started an expedition before 8 AM', icon: 'Sun' },
    { id: 'shutterbug', name: 'NatGeo Photographer', description: 'Uploaded 10 specimen photos', icon: 'Camera' }
];

export const RANKS = [
    { minXp: 0, title: 'Field Intern', color: 'bg-gray-400' },
    { minXp: 200, title: 'Junior Scout', color: 'bg-green-400' },
    { minXp: 500, title: 'Research Assistant', color: 'bg-blue-400' },
    { minXp: 1000, title: 'Senior Ecologist', color: 'bg-purple-400' },
    { minXp: 2500, title: 'Principal Investigator', color: 'bg-yellow-500' }
];

export const DAILY_CHALLENGES = [
    "Find a leaf with parallel veins.",
    "Photograph a pollinator in action.",
    "Find a plant growing in a crack in the pavement.",
    "Identify a tree by its bark texture.",
    "Find a flower with exactly 5 petals.",
    "Locate a non-green plant (e.g., fungi or parasitic).",
    "Find evidence of an animal (tracks, feathers, etc)."
];

export const FALLBACK_SUGGESTIONS = [
    "Identify a Specimen",
    "Start Lab Report",
    "Join Bio-Blitz",
    "3D Structural Analysis"
];

export const INITIAL_POSTS = [
    {
        id: 1,
        userId: 'p1',
        user: "Dr. Aris",
        avatar: "https://i.pravatar.cc/150?u=aris",
        title: "Quercus Suber Morphology",
        description: "Analyzing the bark texture variations in Mediterranean climates. The Gaussian splat reveals significant depth variance in the ridges.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Quercus_suber_trunk.jpg/640px-Quercus_suber_trunk.jpg",
        likes: 42,
        comments: 12,
        timestamp: "2h ago",
        tags: ["Botany", "Trees", "Mediterranean"]
    },
    {
        id: 2,
        userId: 'p2',
        user: "Sarah Bio",
        avatar: "https://i.pravatar.cc/150?u=sarah",
        title: "Fungi Growth Pattern",
        description: "3D scan of a polypore mushroom found in local park. Note the pore surface structure.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Amanita_muscaria_3_vliegenzwammen_op_rij.jpg/640px-Amanita_muscaria_3_vliegenzwammen_op_rij.jpg",
        likes: 89,
        comments: 5,
        timestamp: "5h ago",
        tags: ["Mycology", "Fungi", "Forest Floor"]
    }
];
