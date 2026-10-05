class_name GameData
extends RefCounted

const SPACE_NAMES: Array[String] = [
	"DÉPART","Paris","Lyon","Marseille","Événement","Nice","Plage Azur","Toulouse","Bordeaux","Banque",
	"Nantes","Lille","Événement mondial","Strasbourg","Montpellier","Plage Atlantique","Rennes","Reims","Prison","Le Havre",
	"Saint-Étienne","Toulon","Événement","Grenoble","Dijon","Plage Manche","Angers","Nîmes","Banque","Villeurbanne",
	"Clermont-Ferrand","Aix-en-Provence","Événement mondial","Brest","Plage Méditerranée","Caen"
]

const SPACE_TYPES: Array[String] = [
	"start","property","property","property","event","property","beach","property","property","bank",
	"property","property","global","property","property","beach","property","property","jail","property",
	"property","property","event","property","property","beach","property","property","bank","property",
	"property","property","global","property","beach","property"
]

const START_MONEY := 200000
const START_BONUS := 30000
const BANK_BONUS := 25000
const JAIL_FINE := 20000
const BOARD_SPACE_COUNT := 36

static func space_name(index: int) -> String:
	if index < 0 or index >= SPACE_NAMES.size():
		return "?"
	return SPACE_NAMES[index]

static func space_type(index: int) -> String:
	if index < 0 or index >= SPACE_TYPES.size():
		return "unknown"
	return SPACE_TYPES[index]
