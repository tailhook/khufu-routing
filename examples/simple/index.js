import {createStore, applyMiddleware} from 'redux'
import {attach} from 'khufu-runtime'
import {main} from './main.khufu'
import {Router} from 'khufu-routing'

let router = new Router(window);
let kh = attach(document.getElementById('app'), main(router), {
    store(reducer, middleware, state) {
        return createStore(reducer, state,
            applyMiddleware(...middleware))
    }
})
router.subscribe(kh.queue_render)
