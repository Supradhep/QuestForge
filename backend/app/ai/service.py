import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any
from dotenv import load_dotenv

# Always load backend/.env regardless of working directory
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(ENV_PATH, override=True)


class AIService:
    def generate_story_element(self, theme: str, element_type: str, **kwargs) -> str:
        raise NotImplementedError


class DemoAIService(AIService):
    """
    Fast deterministic local content generator when offline or API quota is reached.
    """
    def __init__(self):
        self.themes = {
            "Fantasy": {
                "title": "The Obsidian Reliquary",
                "story": "Deep beneath the shattered cathedral lies the Obsidian Reliquary. Follow the runic inscriptions through the ancient chambers and claim the relic before the torches die.",
                "locations": [
                    "Shattered Nave", "Elven Sanctum", "Dwarven Forge", "Crystal Caverns",
                    "Whispering Archives", "Cursed Catacombs", "Obsidian Bridge", "Sunken Reliquary",
                    "Runic Observatory", "Alchemist's Vault", "Moonlit Cloister", "Ember Throne"
                ],
                "traps": [
                    "A concealed floor rune erupts in searing flame!",
                    "Iron spikes lance upward from a pressure plate!",
                    "A phantom ward drains your stamina as you cross the threshold!",
                    "Venomous darts volley from carved gargoyles along the wall!"
                ],
                "treasure": "The Obsidian Reliquary rests upon a monolithic altar, radiating ancient golden light."
            },
            "Sci-Fi": {
                "title": "The Hyperion Anomaly",
                "story": "Aboard the derelict orbital vessel Hyperion, the quantum core is destabilizing. Navigate the sealed decks and secure the core before containment fails.",
                "locations": [
                    "Docking Airlock", "Cryo Stasis Bay", "Quantum Server Room", "Hydroponics Dome",
                    "Reactor Overlook", "Zero-G Shaft", "Telemetry Deck", "Biomedical Lab",
                    "Xenobiology Wing", "Plasma Conduit Hub", "Navigation Bridge", "Core Vault"
                ],
                "traps": [
                    "An automated defense turret sweeps the corridor with laser fire!",
                    "A ruptured coolant line blasts freezing vapor across the deck!",
                    "A security node triggers an electromagnetic shockwave!",
                    "Arcing high-voltage cables lash across the bulkhead!"
                ],
                "treasure": "The Quantum Core pulses inside its magnetic suspension field, awaiting extraction."
            },
            "Pirate": {
                "title": "The Siren's Compass",
                "story": "Captain Vane hid the Siren's Compass deep within a labyrinth of sea caves and wrecked galleons. Outsmart his traps before the rising tide seals the cavern.",
                "locations": [
                    "Smuggler's Landing", "Barnacle Grotto", "Shipwreck Reef", "Dead Man's Lookout",
                    "Gunpowder Cellar", "Sunken Galleon", "Siren's Lagoon", "Kraken's Maw",
                    "Quartermaster's Den", "Tidal Causeway", "Skull Cavern", "Captain's Vault"
                ],
                "traps": [
                    "A rusted tripwire releases a swinging boarding axe!",
                    "Rigged powder kegs detonate along the narrow ledge!",
                    "The rotten planking gives way over a spiked pit!",
                    "Poisoned blowdarts shoot from the carved totems!"
                ],
                "treasure": "The Siren's Compass gleams atop an ironbound chest of Spanish gold."
            },
            "Horror": {
                "title": "The Ravenscroft Ledger",
                "story": "The iron doors of Ravenscroft Manor have locked behind you. Follow the journal entries left in the dark to reach the cellar vault and escape.",
                "locations": [
                    "Foyer of Echoes", "Abandoned Infirmary", "Flooded Cellar", "Clockwork Belltower",
                    "Hall of Mirrors", "Seance Parlor", "Ashen Corridor", "Withered Greenhouse",
                    "West Wing Ward", "Surgeon's Theater", "Attic Nursery", "Ritual Sanctum"
                ],
                "traps": [
                    "Rusted wire snares your ankles in the dark!",
                    "An iron grate slams violently across the passage!",
                    "Choking black dust pours from the corroded vents!",
                    "The floorboards splinter into a pit below!"
                ],
                "treasure": "The heavy iron key and the leather-bound ledger rest upon the stone slab."
            },
            "Detective": {
                "title": "The Cipher Dossier",
                "story": "A syndicate courier vanished into the city's underground network. Follow the trail of dead-drops to recover the encrypted dossier before daybreak.",
                "locations": [
                    "Rain-Slicked Alley", "Backroom Speakeasy", "Subway Platform", "Harbor Freight Office",
                    "Clocktower Study", "Pawnshop Basement", "Old Printing Press", "Rooftop Watertanks",
                    "Archive Vault", "Switchboard Exchange", "Railyard Depot", "Director's Safe"
                ],
                "traps": [
                    "A silent laser tripwire triggers a concussive charge!",
                    "Syndicate lookouts ambush you from the shadows!",
                    "A rigged cabinet releases blinding tear gas!",
                    "An electrified lock jolts you as you test the handle!"
                ],
                "treasure": "The encrypted syndicate dossier sits inside the open titanium safe."
            },
            "Archaeology": {
                "title": "The Astrolabe of Akhen",
                "story": "Desert winds have uncovered the buried temple of Akhen. Descend through the star-aligned halls and recover the celestial astrolabe before the tomb collapses.",
                "locations": [
                    "Sunken Obelisk", "Hall of Jackals", "Scarab Passage", "Starlight Chamber",
                    "Canopic Shrine", "Sand-Choked Cistern", "Chariot Armory", "Hieroglyph Gallery",
                    "Royal Antechamber", "Obsidian Nilometer", "Pillar Courtyard", "Sanctum of Ra"
                ],
                "traps": [
                    "Counterweighted stone slabs slam together from both walls!",
                    "Jets of ancient oil ignite along the narrow walkway!",
                    "Sand pours rapidly from hidden ceiling chutes!",
                    "Bronze pendulum blades sweep across the sunken floor!"
                ],
                "treasure": "The celestial astrolabe shines beneath a single shaft of desert light."
            }
        }

    def _get_fallback_theme(self, theme: str):
        return self.themes.get(theme, self.themes["Fantasy"])


class GeminiAIService:
    def __init__(self):
        self.candidate_models = [
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-3.7-flash",
            "gemini-3.5-flash",
        ]

    def _call_gemini_json(self, prompt: str, timeout: int = 12) -> Dict[str, Any]:
        load_dotenv(ENV_PATH, override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "YOUR_API_KEY_HERE":
            raise ValueError("Gemini API key not configured.")

        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.7,
            }
        }).encode("utf-8")

        last_err = None
        for model_name in self.candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    raw = json.loads(resp.read().decode("utf-8"))
                    text = raw["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(text)
            except Exception as e:
                last_err = e
                continue

        raise RuntimeError(f"All Gemini models failed: {last_err}")

    def generate_hunt_lore(self, skeleton: Dict[str, Any]) -> Dict[str, Any]:
        diff = skeleton.get('difficulty_level', 'Medium')
        if diff == "Easy":
            clue_style = (
                "Write a 2-line cryptic rhyme or poetic enigma hinting at the atmosphere of the target chamber. "
                "NEVER use imperative directions like 'Seek the room', 'Follow', 'Examine', 'Inspect', or 'Search', "
                "and NEVER use any word from the target chamber's name."
            )
            riddle_style = "Write a classic, approachable 2-line riddle with an unmistakable 1-word answer."
        elif diff == "Hard":
            clue_style = (
                "Write a deeply arcane, obscure 2-line metaphorical verse using dark symbolism and oblique riddles "
                "that only indirectly alludes to the target chamber's essence. NEVER use imperative verbs ('Seek', 'Go', 'Follow', 'Examine') "
                "and NEVER use any word or synonym from the target chamber's title."
            )
            riddle_style = "Write a challenging, ancient philosophical riddle with a clever 1-word answer."
        else:
            clue_style = (
                "Write a cryptic 2-line poetic riddle or mysterious proverb that metaphorically alludes to the target chamber's essence. "
                "NEVER use imperative directions like 'Seek the room', 'Follow', 'Examine', 'Inspect', or 'Search', "
                "and NEVER use any word from the target chamber's name."
            )
            riddle_style = "Write a clever, atmospheric riddle with a clear 1-word answer."

        prompt = f"""You are a master narrative game designer creating an atmospheric Treasure Hunt.
Parameters:
Theme: {skeleton.get('theme', 'Fantasy')}
Difficulty: {diff}
Start Node ID: {skeleton.get('start_node', 'loc_0')}
Treasure Vault Node ID: {skeleton.get('treasure_node', 'loc_n')}
Optimal Path of Node IDs from Start to Treasure: {skeleton.get('optimal_path', [])}
All Node IDs: {skeleton.get('nodes', [])}
Edges connecting nodes: {skeleton.get('edges', [])}
Clue dependencies (clue located at first node_id cryptically hints at / unlocks second node_id): {skeleton.get('clue_deps', [])}
Trap Node IDs: {skeleton.get('trap_nodes', [])}
Guardian Node IDs: {skeleton.get('guardian_nodes', [])}

Return ONLY valid raw JSON matching this exact structure:
{{
  "title": "String (evocative title)",
  "story": "String (2 atmospheric sentences setting up the quest)",
  "locations": {{
    "node_id": {{
      "name": "String (2-3 words, purely thematic room name, NO numbers or words like Zone/Node/Room)",
      "description": "String (2 vivid sentences describing the room's sensory details and atmosphere)",
      "guardian_description": "String (visual description of guardian if node_id is in Guardian Node IDs, else null)",
      "guardian_riddle": "String ({riddle_style} if node_id is in Guardian Node IDs, else null)",
      "guardian_condition": "String (the 1-2 word answer to the guardian_riddle if node_id is in Guardian Node IDs, else null)"
    }}
  }},
  "clues": {{
    "node_id": {{
      "riddle": "String ({clue_style})",
      "hint": "String ({clue_style})",
      "answer": "String"
    }}
  }},
  "traps": {{
    "node_id": {{
      "description": "String (1 vivid sentence describing the trap triggering)"
    }}
  }}
}}

CRITICAL RULES:
1. Every node_id in {skeleton.get('nodes', [])} MUST have an entry in "locations" with a unique thematic "name" and "description".
2. Every clue_node in {skeleton.get('clue_deps', [])} MUST have an entry in "clues" keyed by that clue_node's ID.
3. Clues MUST BE CRYPTIC POETIC ENIGMAS:
   - NEVER write any word from the target unlocked chamber's "name" inside "hint" or "riddle".
   - NEVER write instructional sentences like "Examine the...", "Inspect the...", "Search the...", "Seek the room where...", or "Following this direction will guide you...".
   - NEVER use a forward slash '/' to separate poetic lines or riddle lines. Use a newline '\n' or a natural period instead.
   - Example 2-line verse: "Silent eyes of brass drink the silver sky.\nWhere the heavens are measured, the next truth lies."
"""
        return self._call_gemini_json(prompt, timeout=12)

    def evaluate_negotiation(self, condition: str, player_text: str) -> Dict[str, Any]:
        if condition and condition.strip().lower() in player_text.strip().lower():
            return {
                "success": True,
                "response": "The Guardian nods solemnly and steps aside, unsealing the vault."
            }

        prompt = f"""You are a guardian in an adventure game.
Expected answer: "{condition}"
Player's answer: "{player_text}"
Does the player's answer satisfy the riddle (including synonyms or close matches)?
Return ONLY raw JSON: {{"success": true/false, "response": "1 short in-character sentence"}}"""
        try:
            return self._call_gemini_json(prompt, timeout=8)
        except Exception as e:
            print(f"Error evaluating negotiation: {e}")
            return {"success": False, "response": "The Guardian remains unmoved by your words."}


demo_ai_service = DemoAIService()
gemini_ai_service = GeminiAIService()


def get_lore(skeleton: Dict[str, Any]) -> Dict[str, Any]:
    load_dotenv(ENV_PATH, override=True)
    if os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "YOUR_API_KEY_HERE":
        try:
            return gemini_ai_service.generate_hunt_lore(skeleton)
        except Exception as e:
            print(f"Gemini call failed ({e}), using local fallback...")

    theme = skeleton.get("theme", "Fantasy")
    theme_data = demo_ai_service._get_fallback_theme(theme)
    nodes = skeleton.get("nodes", [])
    treasure_node = skeleton.get("treasure_node")

    lore: Dict[str, Any] = {
        "title": theme_data["title"],
        "story": theme_data["story"],
        "locations": {},
        "clues": {},
        "traps": {}
    }

    loc_names = theme_data["locations"]
    for i, node_id in enumerate(nodes):
        if node_id == treasure_node:
            name = loc_names[-1]
            desc = theme_data["treasure"]
        else:
            base_name = loc_names[i % (len(loc_names) - 1)]
            name = base_name if i < len(loc_names) - 1 else f"Inner {base_name}"
            desc = f"You step into the {name}. Faint markings along the stone point toward the adjoining passages."

        loc_data: Dict[str, Any] = {"name": name, "description": desc}
        if node_id in skeleton.get("guardian_nodes", []):
            loc_data["guardian_description"] = "An ancient sentinel stands before the final threshold."
            loc_data["guardian_riddle"] = "I speak without a mouth and hear without ears. I have no body, yet I come alive with wind. What am I?"
            loc_data["guardian_condition"] = "echo"

        lore["locations"][node_id] = loc_data

    cryptic_fallbacks = [
        "Seek the chamber where forgotten echoes linger beneath fractured stone and fading starlight.",
        "Follow the cold draft toward the hall where ancient instruments keep silent watch over the dark.",
        "Where shadows gather around relics of a bygone age, the next seal awaits your step.",
        "Turn away from the gilded false paths; descend toward the place of quiet waters and carved bone."
    ]
    for idx, (clue_node, target_node) in enumerate(skeleton.get("clue_deps", [])):
        target_name = lore["locations"].get(target_node, {}).get("name", target_node)
        cryptic_line = cryptic_fallbacks[idx % len(cryptic_fallbacks)]
        lore["clues"][clue_node] = {
            "riddle": cryptic_line,
            "hint": cryptic_line,
            "answer": target_name
        }

    traps_list = theme_data["traps"]
    for i, trap_node in enumerate(skeleton.get("trap_nodes", [])):
        lore["traps"][trap_node] = {
            "description": traps_list[i % len(traps_list)]
        }

    return lore

