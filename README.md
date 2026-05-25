# Creating splits.json for the Timer mod

This document explains how to create a `splits.json` file for the Timer mod in plain language with examples. You only need to know basic JSON structure; the examples below show ready-to-use snippets.

## Where the file goes

Place the finished file at `terra/mod-data/timer/splits.json` inside your Alabaster Dawn folder so the timer can load it automatically.


## Where to get the events

Enable the *Show Event Overlay* option at the bottom of the Gameplay options before you start. The overlay shows live event values (map names, `langID`s, variable paths, enemy names) that you can use in the splits file.

## Top-level structure

The file must be a JSON object with one key: `splits`, which is an array of event objects.

Example skeleton:

```json
{
  "splits": []
}
```

## Event object fields (overview)

- `type` (required): The kind of event to watch for. See the types below.
- `once` (optional): When `true`, the event is used only once and will be ignored afterwards.
- `disabled` (optional): When `true`, the event is ignored until you remove or change this field.
- Other fields depend on `type` (see each type for details).

## Event types and examples

### 1) `storyEnd`

- When the game reports that a named story (plot) finished.
- Fields: `type: "storyEnd"`, `name` (plot key), optional `once`.

Example: trigger when the plot `plg` ends (only once):

```json
{
  "type": "storyEnd",
  "name": "plg",
  "once": true
}
```

Notes: If you omit `name` or set it to an empty string, the event will match any story end.

### 2) `centerMessage`

- When a centered message appears on screen.
- Fields: `type: "centerMessage"`, `langID` (a number identifying the message), optional `once`.

Example: trigger for language/message id `291`:

```json
{
  "type": "centerMessage",
  "langID": 291,
  "once": true
}
```

### 3) `loadmap`

- When the player is teleported / a map is loaded.
- Fields: `type: "loadmap"`, `name` (map name), optional `once`.

Example: split when map `town_square` loads:

```json
{
  "type": "loadmap",
  "name": "town_square"
}
```

### 4) `eventTriggered` (variable change)

- When a game variable changes to a specific value.
- Fields: `type: "eventTriggered"`, `name` (variable path), `value` (the value to match), optional `once`.

Example: trigger when `map.puzzle1Done` becomes `true`:

```json
{
  "type": "eventTriggered",
  "name": "map.puzzle1Done",
  "value": true
}
```

### 5) `hp`

- When an enemy's HP is reported (useful for boss HP triggers).
- Fields: `type: "hp"`, `name` (enemy name), optional `below` and/or `above` (numbers), optional `once`.

How `below` and `above` work:

- `below`: the event only triggers if the reported HP is less than or equal to `below`.
- `above`: the event only triggers if the reported HP is greater than or equal to `above`.

Example: trigger when an enemy named `boss_ogre` drops to 0 HP (dead):

```json
{
  "type": "hp",
  "name": "boss_ogre",
  "below": 0,
  "once": true
}
```

Example: trigger when a boss falls below half HP (assuming max 100):

```json
{
  "type": "hp",
  "name": "boss_ogre",
  "below": 50
}
```

### 6) `combined`

- Combine several events so the split only happens after all listed conditions are satisfied.
- Fields: `type: "combined"`, `conditions` (an array of Event objects), optional `once`.

Example: split after the player loads map `dungeon` and then a variable `map.puzzle1Done` becomes `true`:

```json
{
  "type": "combined",
  "conditions": [
    { "type": "loadmap", "name": "dungeon" },
    { "type": "eventTriggered", "name": "map.puzzle1Done", "value": true }
  ],
  "once": true
}
```

## Full example file

This example shows several types in one `splits.json`:

```json
{
  "splits": [
    { "type": "storyEnd", "name": "plg", "once": true },
    { "type": "storyEnd", "name": "ch1", "once": true },
    { "type": "centerMessage", "langID": 291, "once": true },
    { "type": "hp", "name": "boss_ogre", "below": 0, "once": true },
    {
      "type": "combined",
      "conditions": [
        { "type": "loadmap", "name": "dungeon" },
        { "type": "eventTriggered", "name": "map.puzzle1Done", "value": true }
      ],
      "once": true
    }
  ]
}
```

## Tips and troubleshooting

- Make small changes and test one split at a time.
- Use `"once": true` for splits you only want once (e.g., chapter ends).
- Use `"disabled": true` to temporarily turn off a split without deleting it.
- Enable the `Show Event Overlay` option at the bottom of the Gameplay options to see live event values (map names, `langID`s, variable paths, enemy names) while playing — copy those exact values into your splits.
- If a split does not trigger, check that the `name`, `langID`, or `value` match exactly what the game reports.
- The splits file reloads every time you start a run.
