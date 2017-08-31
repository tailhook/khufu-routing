Khufu-Routing
=============

|              |                                           |
|--------------|-------------------------------------------|
|Status        | beta                                      |

A router for [khufu](http://tailhook.github.io/khufu/)-based projects.

It's not pattern based as many other router, but allows to create hierarchy
and compose things.

Features:

* Has a redux-store interface, so integrates with khufu easily
* Address bar is always up to date including all current knobs and
  text fields that should be visible in the url as `?query=fields`
* Keeps track of what controls are actually visible to user automatically
  and which have default value, so the URL isn't overloaded by useless things


Installation
------------

```sh
npm install khufu-routing@0.1.0 --save
```

Setup Code
----------

First create a router:

```js
import {Router} from 'khufu-routing'
let router = new Router(window);
```

Then take a note that `Router` and subrouter classes are actually stores not
reducers (i.e.  objects having `getState()` and `dispatch()` methods not pure
functions), so you need to skip `createStore(..)` for them:

```js
let khufu = attach(document.getElementById('app'), main(router), {
    store(reducer, middleware, state) {
        if(typeof reducer == 'function') {
            return createStore(reducer, state,
                applyMiddleware(...middleware))
        } else {
            return reducer
        }
    }
})
```

And then subscribe for router changes:

```js
router.subscribe(khufu.queue_render)
```

Matching Routes
---------------

Router splits paths on slashes and additionally allows to add query parameters.

To match next path element against constant use `at()`, for example
to match `/site/articles/new` path you would have the following statements:

```js
if let r1 = router.at('site'):
    if let r2 = r1.at('articles'):
        if let r3 = r2.at('new'):
            "new article"
```

In reality it will not be the same block of code, for example you will match
for `site` in `main.khufu`, for `articles` in `site.khufu` and for `new` in `site/articles.khufu`. Additionally each of the `if` statements usually has
it's own part of a template.

To match the value against the rule, rather than constant use `value(func)`:

```js
import {int} from './validators'
if let r1 = router.at('articles'):
    if let [article_id, r2] = r1.value(int):
        `integer article id: ${article_id}`
```

If `func` returns anything other than `null` or `undefined` the `value()`
method returns pair: result of the `func` and subrouter.

Both `at()` and `value()` return subrouters that are basis for three things:

1. Matching down the chain
2. Generating URLs relative to the subrouter
3. Adding query parameters

The no 2 and 3 are explained below.

Matching Query
--------------

Sometimes you want additional things expressed as the query parameter. Create
a store for it using `.query(name)`. Here are examples of two parameters:

```js
<div>
  store @edit_mode = router.query('edit')
  if let r1 = router.at('articles'):
    <div>
      store @filter = r1.query('filter')
      <input type="text" value=@filter>
```

For the URL `/articles?edit=true&filter=xxx` the value of `@edit_mode` store
will be `true` and the value of `@filter` store will be `xxx`.

To make attach actions to them there are two action creators:

* `set()`
* `input()`

The peculiarity of the `input` method is that consequent input isn't added
to the history as separate pages. I.e. when user types text, it will not
get a history entry for every change. Here is how it's used:


```js
import {set, input} from 'khufu-routing'

value main(router):
  <div>
    store @edit_mode = router.query('edit')
    <button>
      link {click} set('true') -> @edit_mode
      "start edit"
    if let r1 = router.at('articles'):
      <div>
        store @filter = r1.query('filter')
        <input type="text" value=@filter>
          link {input} input(event) -> @filter
```

Note also that `queries` are attached to different routers, this means if
users goes to a relative path `..` from `/articles`, i.e. to root of the
site all of it's attached queries stay there, but on child routes are not.
I.e. going to the `..` from `/articles?edit=true&filter=xxx` yields
`/?edit=true`.


Generating URLs
---------------

There is only one tool for generating url, it's specifying path, relative
to the URL of the router (not current page) for example
(the text of the link in example below shows the link target):

```js
if let r1 = router.at('site'):
    <a href=r1.rel('articles')> "List"              # -> /articles
    if let r2 = r1.at('articles'):
        <a href=r2.rel('123')> "Epic Story"         # -> /articles/123
        <a href=r2.rel('../news')> "News"           # -> "/news"
        if let r3 = r2.at('new'):
            <a href=r2.rel('../123')> "Epic Story"  # -> "/articles/123"
            <a href=r2.rel('save')> "Save Article"  # -> "/articles/new/save"
            "new article"
```

Also query arguments added to the URI as described above.


Navigation
----------

For navigation over links use `go()` action creator sending either
link click event or relative path to the appropriate router:

```js
import {set, input} from 'khufu-routing'

value main(router):
  <div>
    <a href=router.rel('articles')>
        link {click} go(event) -> @router
        "List"
    if let r1 = router.at('articles'):
        <a href=r1.rel('123')>
            link {click} go(event) -> @r1
            "Epic story"
        <button>
            link {click} go('new') -> @r1
            New
```


License
=======

Licensed under either of

* Apache License, Version 2.0,
  (./LICENSE-APACHE or http://www.apache.org/licenses/LICENSE-2.0)
* MIT license (./LICENSE-MIT or http://opensource.org/licenses/MIT)
  at your option.

Contribution
------------

Unless you explicitly state otherwise, any contribution intentionally
submitted for inclusion in the work by you, as defined in the Apache-2.0
license, shall be dual licensed as above, without any additional terms or
conditions.

