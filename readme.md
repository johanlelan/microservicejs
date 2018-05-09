# Application flow on the write side

1. UI
    1. Command is an object sent by the user (from the UI) that will modify an aggregate
        * Could be a `POST`, `PATCH`, `DELETE` verbs in REST-API
        * Could be a `PUT` verb for `large import purpose`
1. REST API
    1. handles `user authentication`
        * "authenticated request" is then transform into a `command`
        * "authenticated command" is then sent a `command handler`
1. Command Handler
    1. implements `use cases`
        * validates `input command` on its structure
    1. ensures `task coordination`
        1. uses `given aggregate repository` to get the current aggregate state
            * needed for every command except `creation` ones
        1. uses `given event publisher` to propagate `domain events`
        1. Command handler `invokes` domain model to apply command on the current state of the aggregate
1. Repository
    1. retrieves events from the given `event store` and transforms them to an aggregate state using a reducer defined in the domain model
1. Domain Model
    1. emits one or more `business events` on command apply
1. Event Store
    1. listens all emitted events to persist them