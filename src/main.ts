import { Injectable, Mod, terra } from '@project-selene/api';
import { COMBAT_PARAMS_EVENT, CombatParams, g_scene, Game, SceneManager, ShowCenterMessageStep, ShowOptionDialogStep, System, Vars } from '@project-selene/api/terra';
import { Connection } from './connection';

const connection = new Connection();

let lastPaused = true;
let time = 0;

class Timer extends Injectable(Game) {
    update() {
        super.update();

        if (!terra.g_system.repeatUpdate) {
            const paused = g_scene.isInit() || g_scene.isLoading();
            if (paused !== lastPaused) {
                lastPaused = paused;
                connection.sendPaused(paused);
            }

            if (!paused) {
                time += terra.g_system.tick.real;
                connection.sendIgt(time);
            }
        }
    }
}

class FocusTracker extends Injectable(System) {
    setWindowFocus(focusLost: boolean) {
        if (focusLost && !this.focusLostIgnore) {
            connection.sendPaused(true);
        } else {
            connection.sendPaused(g_scene.isInit() || g_scene.isLoading());
        }
        super.setWindowFocus(focusLost);
    }
}

class StartTracker extends Injectable(ShowOptionDialogStep) {
    getNext(...args: unknown[]) {
        if (this.message.langID === 15) {
            connection.sendStart();
            console.log('[timer] Start');
            time = 0;
        }
        return super.getNext(...args);
    }
}

class EndTracker extends Injectable(ShowCenterMessageStep) {
    start(...args: unknown[]) {
        if (this.message.langID === 291) {
            connection.sendSplit();
        }
        super.start(...args);
    }
}

let container: HTMLDivElement;
function setupPrintEvents(mod: Mod) {
    mod.inject(PrintVariables);
    mod.inject(PrintTeleports);
    mod.inject(PrintHealth);

    container = document.createElement('div');
    container.id = 'timer-debug';
    container.style.position = 'absolute';
    container.style.top = '30px';
    container.style.left = '30px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
}
function addMessage(message: string) {
    const msg = document.createElement('div');
    msg.textContent = message;
    container.appendChild(msg);

    setTimeout(() => {
        container.removeChild(msg);
    }, 10000);
}

class PrintVariables extends Injectable(Vars) {
    set(path: string, value: unknown) {
        super.set(path, value);
        addMessage(`var ${path} = ${value}`);
    }
    delete(path: string) {
        super.delete(path);
        addMessage(`var ${path} = `);
    }
    add(path: string, value: unknown) {
        super.add(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    sub(path: string, value: unknown) {
        super.sub(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    mul(path: string, value: unknown) {
        super.mul(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    div(path: string, value: unknown) {
        super.div(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    mod(path: string, value: unknown) {
        super.mod(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    and(path: string, value: unknown) {
        super.and(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    or(path: string, value: unknown) {
        super.or(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    xor(path: string, value: unknown) {
        super.xor(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    append(path: string, value: unknown) {
        super.append(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
    prepend(path: string, value: unknown) {
        super.prepend(path, value);
        addMessage(`var ${path} = ${this.get(path)}`);
    }
}
class PrintTeleports extends Injectable(SceneManager) {
    teleport(map: string, ...args: unknown[]) {
        addMessage(`teleport ${map}`);
        return super.teleport(map, ...args);
    }
}

class PrintHealth extends Injectable(CombatParams) {
    fireEvent(event: number, ...params: unknown[]) {
        if (event === COMBAT_PARAMS_EVENT.HP_CHANGED
            || event === COMBAT_PARAMS_EVENT.STATS_RESET || event === COMBAT_PARAMS_EVENT.HP_RESET) {
            addMessage(`HP changed: ${this.combatant?.ent?.core?.name} = ${this.currentHP}`);
        }

        return super.fireEvent(event, ...params);
    }
}

export default function main(mod: Mod) {
    mod.inject(Timer);
    mod.inject(FocusTracker);
    mod.inject(StartTracker);
    mod.inject(EndTracker);

    // setupPrintEvents(mod);

    connection.connect(
        () => console.log('[timer] Connected to LiveSplit'),
        () => console.log('[timer] Disconnected from LiveSplit')
    );
}

export function unload() {
    document.body.removeChild(container);
    connection.disconnect();
}