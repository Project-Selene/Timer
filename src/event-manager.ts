import { Hooks } from "./hooks";

type Action = { type: 'hp', name: string, hp: number }
    | { type: 'teleport', mapName: string }
    | { type: 'vars', path: string, value: unknown }
    | { type: 'centerMessage', langID: number }
    | { type: 'storyEnd', name: string }
    ;

type Event = { disabled?: true, once?: true } & (
    { type: 'loadmap', name: string }
    | { type: 'eventTriggered', name: string, value: unknown }
    | { type: 'hp', name: string, below?: number, above?: number }
    | { type: 'storyEnd', name: string }
    | { type: 'centerMessage', langID: number }
    | { type: 'combined', conditions: Event[] }
);

interface Config {
    splits: Event[];
}

export class EventManager {
    private onsplit = () => { };

    private activeConfig: Config = { splits: [] };
    private rawConfig: Config = {
        splits: [
            {
                type: 'storyEnd',
                name: 'plg',
                once: true,
            },
            {
                type: 'storyEnd',
                name: 'ch1',
                once: true,
            },
            {
                type: 'storyEnd',
                name: 'ch1b',
                once: true,
            },
            {
                type: 'storyEnd',
                name: 'ch1c',
                once: true,
            },
            {
                type: 'storyEnd',
                name: 'ch2',
                once: true,
            },
            {
                type: 'centerMessage',
                langID: 291,
                once: true,
            }]
    };

    /** This should only be called once */
    init(onsplit: () => void) {
        this.onsplit = onsplit;

        Hooks.hookEnemyHP((name, hp) => { this.check({ type: 'hp', name, hp }) });
        Hooks.hookTeleport((mapName) => { this.check({ type: 'teleport', mapName }) });
        Hooks.hookVariableChange((path, value) => { this.check({ type: 'vars', path, value }) });
        Hooks.hookStoryEnd((plotKey) => { this.check({ type: 'storyEnd', name: plotKey }) });
        Hooks.hookCenterMessage((langID) => { this.check({ type: 'centerMessage', langID }) });

        this.loadConfig();
    }

    reset() {
        this.activeConfig = JSON.parse(JSON.stringify(this.rawConfig));
        this.loadConfig();
    }

    private loadConfig() {
        fetch('mod-data/timer/splits.json')
            .then(res => res.json())
            .then((config: Config) => {
                this.rawConfig = config;
                this.activeConfig = JSON.parse(JSON.stringify(this.rawConfig));
            })
            .catch(() => {
                console.warn('[timer] Failed to load splits config');
            });
    }

    private check(action: Action) {
        for (const event of this.activeConfig.splits) {
            if (event.disabled) {
                continue;
            }

            const [split, once] = this.checkEvent(event, action);
            if (split) {
                console.log('[timer] Split event: ', event);
                this.onsplit();

                if (once) {
                    event.disabled = true;
                    console.log('[timer] Disabled event: ', event);
                }
            }
        }
    }

    private checkEvent(event: Event, action: Action): [boolean, boolean] {
        switch (event.type) {
            case 'loadmap': {
                if (action && action.type === 'teleport') {
                    const map = action.mapName;
                    if (map === event.name || !event.name) {
                        return [true, !!event.once];
                    }
                }
                break;
            }
            case 'storyEnd': {
                if (action && action.type === 'storyEnd') {
                    if (action.name === event.name || !event.name) {
                        return [true, !!event.once];
                    }
                }
                break;
            }
            case 'centerMessage': {
                if (action && action.type === 'centerMessage') {
                    if (action.langID === event.langID) {
                        return [true, !!event.once];
                    }
                }
                break;
            }
            case 'eventTriggered': {
                if (action && action.type === 'vars' && action.path === event.name && action.value === event.value) {
                    return [true, !!event.once];
                }
                break;
            }
            case 'hp': {
                if (action && action.type === 'hp' && action.name === event.name) {
                    if (typeof event.below === 'number' && action.hp > event.below) {
                        break;
                    }
                    if (typeof event.above === 'number' && action.hp < event.above) {
                        break;
                    }
                    return [true, !!event.once];
                }
                break;
            }
            case 'combined': {
                const conds = event.conditions;
                if (conds.length === 0) {
                    return [true, true];
                }

                for (let i = 0; i < conds.length; i++) {
                    const [split, once] = this.checkEvent(conds[i], action);
                    if (!split) {
                        return [false, false];
                    }

                    if (once) {
                        conds.splice(i, 1);
                        i--;
                    }
                }

                if (conds.length === 0) {
                    return [true, true];
                }
                return [true, !!event.once];
            }
        }
        return [false, false];
    }
}