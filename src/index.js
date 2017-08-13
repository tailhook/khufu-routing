export class Router {
    constructor(window, history) {
        this._win = window
        this._history = history
        this._listeners = []
        this._pop_state = this._pop_state.bind(this);
        this.close = this.close.bind(this);
        this._win.addEventListener("popstate", this._pop_state)
    }
    close() {
        this._win.removeEventListener(this._pop_state)
    }
    _pop_state() {
    }
    getState() {
        return {}
    }
    dispatch(ev) {

    }
    subscribe(callback) {
        this._listeners.push(callback);
        return function() {
            let idx = this._listeners.indexOf(callback);
            if(idx >= 0) {
                this._listeners.splice(idx, 1);
            }
        }
    }
}
