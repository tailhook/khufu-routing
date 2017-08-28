import {createStore, applyMiddleware} from 'redux'
import {attach} from 'khufu-runtime'
import {main} from './main.khufu'
import {Router} from 'khufu-routing'

let router = new Router(window);
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
