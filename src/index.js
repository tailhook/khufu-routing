export class Router {
    constructor(win) {
        this._win = win
        this._history = win.history
        this._loc = win.location

        this._root = this
        this.close = this.close.bind(this);
        this._listeners = []
        this._parts = this._loc.pathname.split('/').slice(1)

        win.addEventListener("popstate", this._pop_state.bind(this))
        win.addEventListener("hashchange", this._hash_change.bind(this))
    }
    close() {
        this._win.removeEventListener(this._pop_state)
        delete this._root
        delete this._win
    }

    _pop_state() {
        console.log("PPSATET")
    }
    _hash_change() {
        console.log("HASH")
    }
    // API
    at(name) {
        if(this._parts[0] == name) {
            return new _Subrouter(this, [name], this._parts.slice(1))
        }
    }
    // --------------
    // Store protocol
    // --------------
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
    _path() {
        return []
    }
    abs(...parts) {
        return '/' + parts.join('/')
    }
}

class _Subrouter {
    constructor(parent, rel_path, tail) {
        this._rel_path = rel_path
        this._parent = parent
        this._root = parent._root
        this._tail = tail
    }
    _path() {
        let arr = this._parent._path()
        return arr.concat(this._rel_path)
    }
    at(name) {
        console.log("AT ", this)
        if(this._tail[0] == name) {
            return new _Subrouter(this, [name], this._tail.slice(1))
        }
    }
    rel(path) {
        let cur_path = this._path()
        let parts = path.split('/')
        for(let i = 0; i < parts.length; ++i) {
            let item = parts[i];
            switch(item) {
                case '..':
                    cur_path.pop();
                    break;
                case '.':
                    break;
                default:
                    cur_path.push(item);
                    break;
            }
        }
        return '/' + cur_path.join('/')
    }
    getState() {
        return this
    }
    dispatch(action) {
        switch(action.type) {
            case 'go':
                let url = this.rel(action.value);
                this._root._history.pushState({}, '', url)
                break;
        }
    }
    subscribe() { return () => null }
}

export function go(value) {
    return {type: 'go', value: value}
}
