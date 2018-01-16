import {createStore, applyMiddleware} from 'redux'
import {attach} from 'khufu-runtime'
import {main} from './main.khufu'
import {Router} from 'khufu-routing'

let prefix = []
if(window.location.pathname.charAt(1) == '~') {
    // check different site root
    prefix = [window.location.pathname.split('/', 2)[1]]
    console.log("PREFIX", prefix)
}
let router = new Router(window, prefix);
let kh = attach(document.getElementById('app'), main(router), {
    store(reducer, middleware, state) {
        if(typeof reducer == 'function') {
            return createStore(reducer, state,
                applyMiddleware(...middleware))
        } else {
            return reducer
        }
    }
})
router.subscribe(kh.queue_render)
