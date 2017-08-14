import {createStore, applyMiddleware} from 'redux'
import khufu from 'khufu-runtime'
import {main} from './main.khufu'
import {Router} from 'khufu-routing'

khufu(document.getElementById('app'), main(new Router(window)), {
    store(reducer, middleware, state) {
        return createStore(reducer, state,
            applyMiddleware(...middleware))
    }
})
