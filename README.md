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

