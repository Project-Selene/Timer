import { Injectable, Mod, terra } from '@project-selene/api';
import { g_options, g_scene, Game, ShowOptionDialogStep } from '@project-selene/api/terra';
import { Connection } from './connection';
import { EventManager } from './event-manager';
import { Hooks } from './hooks';

const connection = new Connection();
const eventManager = new EventManager();

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

            //TODO: Figure out how to properly keep track of time while the game is minimized
            // if (!paused) {
            //     time += terra.g_system.tick.real;
            //     connection.sendIgt(time);
            // }
        }
    }
}

class StartTracker extends Injectable(ShowOptionDialogStep) {
    getNext(...args: unknown[]) {
        if (this.message.langID === 15) {
            eventManager.reset();
            connection.sendStart();
            const paused = g_scene.isInit() || g_scene.isLoading();
            connection.sendPaused(paused);
            lastPaused = paused;
            console.log('[timer] Start');
            time = 0;
        }
        return super.getNext(...args);
    }
}

let container: HTMLDivElement;
function setupPrintEvents() {
    container = document.createElement('div');
    container.id = 'timer-debug';
    container.style.position = 'absolute';
    container.style.top = '30px';
    container.style.left = '30px';
    container.style.zIndex = '9999';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.userSelect = 'all';
    document.body.appendChild(container);

    Hooks.hookTeleport((mapName) => {
        addMessage(`teleport ${mapName}`);
    });
    Hooks.hookVariableChange((path, value) => {
        addMessage(`variable change ${path} = ${value}`);
    });
    Hooks.hookEnemyHP((name, hp) => {
        addMessage(`hp ${name} = ${hp}`);
    });
    Hooks.hookStoryEnd((plotKey) => {
        addMessage(`story end ${plotKey}`);
    });
    Hooks.hookCenterMessage((langID) => {
        addMessage(`center message ${langID}`);
    });
}
function addMessage(message: string) {
    if (!g_options.get('mod-timer-show-event')) {
        return;
    }
    const msg = document.createElement('div');
    msg.textContent = message;
    container.appendChild(msg);

    setTimeout(() => {
        container.removeChild(msg);
    }, 10000);
}


export default function main(mod: Mod) {
    mod.inject(Timer);
    mod.inject(StartTracker);

    Hooks.init(mod);

    setupPrintEvents();

    eventManager.init(() => {
        connection.sendSplit();
    });

    connection.connect(
        () => console.log('[timer] Connected to LiveSplit'),
        () => console.log('[timer] Disconnected from LiveSplit')
    );
}

export function unload() {
    try {
        document.body.removeChild(container);
    } catch {
        // ignore
    }
    connection.disconnect();
}