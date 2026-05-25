import { Injectable, Mod } from "@project-selene/api";
import { COMBAT_PARAMS_EVENT, CombatParams, SceneManager, ShowCenterMessageStep, StoryEndDisplay, Vars } from "@project-selene/api/terra";

const variablesCallbacks: ((path: string, value?: unknown) => void)[] = [];
const teleportCallbacks: ((mapName: string) => void)[] = [];
const enemyHpCallbacks: ((name: string, hp: number) => void)[] = [];
const storyEndCallbacks: ((plotKey: string) => void)[] = [];
const centerMessageCallbacks: ((langID: number) => void)[] = [];

export class Hooks {
    static init(mod: Mod) {
        mod.inject(VariablesChangeTracker);
        mod.inject(TeleportTracker);
        mod.inject(HealthChangeTracker);
        mod.inject(StoryEndTracker);
        mod.inject(CenterMessageTracker);
    }

    static hookVariableChange(callback: (path: string, value?: unknown) => void) {
        variablesCallbacks.push(callback);
    }

    static hookTeleport(callback: (mapName: string) => void) {
        teleportCallbacks.push(callback);
    }

    static hookEnemyHP(callback: (name: string, hp: number) => void) {
        enemyHpCallbacks.push(callback);
    }

    static hookStoryEnd(callback: (plotKey: string) => void) {
        storyEndCallbacks.push(callback);
    }

    static hookCenterMessage(callback: (langID: number) => void) {
        centerMessageCallbacks.push(callback);
    }
}

class VariablesChangeTracker extends Injectable(Vars) {
    set(path: string, value: unknown) {
        super.set(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, value);
        }
    }
    delete(path: string) {
        super.delete(path);
        for (const callback of variablesCallbacks) {
            callback(path);
        }
    }
    add(path: string, value: unknown) {
        super.add(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    sub(path: string, value: unknown) {
        super.sub(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    mul(path: string, value: unknown) {
        super.mul(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    div(path: string, value: unknown) {
        super.div(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    mod(path: string, value: unknown) {
        super.mod(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    and(path: string, value: unknown) {
        super.and(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    or(path: string, value: unknown) {
        super.or(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    xor(path: string, value: unknown) {
        super.xor(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    append(path: string, value: unknown) {
        super.append(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
    prepend(path: string, value: unknown) {
        super.prepend(path, value);
        for (const callback of variablesCallbacks) {
            callback(path, this.get(path));
        }
    }
}

class TeleportTracker extends Injectable(SceneManager) {
    teleport(map: string, ...args: unknown[]) {
        for (const callback of teleportCallbacks) {
            callback(map);
        }
        return super.teleport(map, ...args);
    }
}

class HealthChangeTracker extends Injectable(CombatParams) {
    fireEvent(event: number, ...params: unknown[]) {
        if (event === COMBAT_PARAMS_EVENT.HP_CHANGED
            || event === COMBAT_PARAMS_EVENT.STATS_RESET || event === COMBAT_PARAMS_EVENT.HP_RESET) {
            for (const callback of enemyHpCallbacks) {
                callback(this.combatant?.ent?.enemy?.enemyType?.cacheKey || this.combatant?.ent?.npc?.char?.cacheKey || "", this.currentHP);
            }
        }

        return super.fireEvent(event, ...params);
    }
}

class StoryEndTracker extends Injectable(StoryEndDisplay) {
    show(plotKey: string) {
        for (const callback of storyEndCallbacks) {
            callback(plotKey);
        }
        return super.show(plotKey);
    }
}

class CenterMessageTracker extends Injectable(ShowCenterMessageStep) {
    start(...args: unknown[]) {
        for (const callback of centerMessageCallbacks) {
            callback(this.message.langID);
        }
        super.start(...args);
    }
}