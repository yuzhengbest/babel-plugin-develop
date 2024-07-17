console.log(1)

function fn() {
    console.info(2)
}

export default class Example {
    say() {
        console.debug(3);
    }
    render() {
        return <div>{console.error(4)}</div>
    }
}
