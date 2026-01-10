import { Injectable, Mod, terra } from '@project-selene/api';
import { g_scene, Game, ShowOptionDialogStep, System } from '@project-selene/api/terra';
import { Connection } from './connection';

const connection = new Connection();

let lastPaused = true;
let time = 0;

class Timer extends Injectable(Game) {
    update() {
        super.update();

        if (!terra.g_system.repeatUpdate) {
            const paused = !g_scene.isRunning() && !g_scene.isMenu() && !g_scene.isTitle();
            if (paused !== lastPaused) {
                lastPaused = paused;
                connection.sendPaused(paused);
                console.log(paused ? "paused" : "running");
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
            connection.sendPaused(!g_scene.isRunning() && !g_scene.isMenu() && !g_scene.isTitle());
        }
        super.setWindowFocus(focusLost);
    }
}

class StartTracker extends Injectable(ShowOptionDialogStep) {
    start(...args: unknown[]) {
        if (this.message.langID === 471) {
            connection.sendSplit();
        }
        super.start(...args);
    }

    getNext(...args: unknown[]) {
        if (this.message.langID === 15) {
            connection.sendStart();
            time = 0;
        }
        return super.getNext(...args);
    }
}

export default function main(mod: Mod) {
    mod.inject(Timer);
    mod.inject(FocusTracker);
    mod.inject(StartTracker);
    connection.connect(
        () => console.log('[timer] Connected to LiveSplit'),
        () => console.log('[timer] Disconnected from LiveSplit')
    );
}

export function unload() {
    connection.disconnect();
}