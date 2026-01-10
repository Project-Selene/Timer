import type net from 'net';

export class Connection {
    private readonly net: typeof net = window["require"]('net');
    private livesplit: net.Socket | null = null;

    connect(onconnect?: () => void, ondisconnect?: () => void) {
        onconnect = onconnect || (() => { });
        ondisconnect = ondisconnect || (() => { });

        this.livesplit = this.net.connect(12347, '127.0.0.1');
        this.livesplit.on('connect', () => onconnect());
        this.livesplit.on('disconnect', () => this.connect());
        this.livesplit.on('error', (...error) => console.error(...error));
    }

    disconnect() {
        if (this.livesplit) {
            this.livesplit.resetAndDestroy();
            this.livesplit = null;
        }
    }

    sendStart() {
        if (!this.livesplit || !this.livesplit.writable) {
            return;
        }

        this.livesplit.write('1\n');
    }

    sendIgt(value: number) {
        if (!this.livesplit || !this.livesplit.writable) {
            return;
        }

        this.livesplit.write('3');
        this.livesplit.write(value.toString());
        this.livesplit.write('\n');
    }

    sendSplit() {
        if (!this.livesplit || !this.livesplit.writable) {
            console.warn('[timer] Could not send split');
            return;
        }

        this.livesplit.write('2\n');
    }

    sendPaused(paused: boolean) {
        if (!this.livesplit || !this.livesplit.writable) {
            return;
        }

        if (paused) {
            this.livesplit.write('4\n');
        } else {
            this.livesplit.write('5\n');
        }
    }
}
