export default `
sequenceDiagram
    alt Every minute
    Alice->>+John: Hello John, how are you?
    activate John
    John-->>-Alice: Great!
    deactivate John
    else En caso
    Note over Alice,John: A typical interaction
    end
    `;
