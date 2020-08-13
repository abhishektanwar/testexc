import React,{ useState } from 'react'


const TYPE={
    LIMIT:'LIMIT',
    MARKET:'MARKET'
};

const SIDE = {
    BUY:0,
    SELL:1
};


function NewOrder({createMarketOrder, createLimitOrder}) {
    const onSubmit =(e) => {
        e.preventDefault();
        if(order.type === TYPE.MARKET){
            createMarketOrder(order.amount, order.side);
        }
        else{
            createLimitOrder(order.amount,order.price,order.side);
        }
    }
    const [order, setOrder] = useState({
        type:TYPE.LIMIT,
        side:SIDE.BUY,
        amount:'',
        price:''
    });
    return (
        <div id="orders" className="card">
            <h2 className="card-title">New Order</h2>
            <form onSubmit={(e) => onSubmit(e)}>
                {/* type of order market / limit */}
                <div className="form-group row">
                    <label htmlFor="type" className="col-sm-4 col-form-label">Type</label>
                    <div className="col-sm-8">
                        <div id="type" className="btn-group" role="group">
                            <button
                                type="button"
                                className={`btn btn-secondary ${order.type===TYPE.LIMIT ? 'active':''}`}
                                onClick={() => setOrder(order => ({...order, type:TYPE.LIMIT}))}
                            >LIMIT
                            </button>
                            <button
                                type="button"
                                className = {`btn btn-secondary ${order.type === TYPE.MARKET ? 'active':''}`}
                                onClick={() => setOrder(order => ({...order,type:TYPE.MARKET}))}
                            >MARKET
                            </button>
                        </div>
                    </div>
                </div>

                {/* SELL OR BUY  */}
                <div className="form-group row">
                    <label htmlFor="side" className="col-sm-4 col-form-label">SIDE</label>
                    <div className="col-sm-8">
                        <div id="side" className="btn-group" role="group">
                            <button
                                type="button"
                                className={`btn btn-secondary ${order.side===SIDE.BUY ? 'active':''}`}
                                onClick={() => setOrder(order => ({...order,side:SIDE.BUY}))}
                            >BUY
                            </button>
                            <button
                                type="button"
                                className ={`btn btn-secondary ${order.side === SIDE.SELL ? 'active':''}`}
                                onClick= {() => setOrder(order => ({...order,side:SIDE.SELL}))}
                            >SELL
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-group row">
                    <label className="col-sm-4 col-form-label" htmlFor="order-amount">Amount</label>
                    <div className="col-sm-8">
                        <input 
                            type="text"
                            className="form-control"
                            // not working 
                            // onChange={(e)=> setOrder(order => ({...order,amount:e.target.value}))}
                            onChange = {({target:{value}}) => setOrder(order => ({...order,amount:value}))}
                        />
                    </div>
                </div>

                {/* price input field required if order type is limit */}
                {/* if not market type order show price input field */}
                {order.type===TYPE.MARKET ? null :
                    <div className="form-group row">
                        <label className="col-sm-4 col-form-label" htmlFor="order-amount">Price</label>
                        <div className="col-sm-8">
                            <input 
                                type="text"
                                className="form-control"
                                onChange={({target:{value}}) => setOrder(order => ({...order,price:value}))}
                            />
                        </div>
                    </div>
                }
                <div className="text-right">
                    <button type="submit" className="btn btn-primary">SUBMIT</button>
                </div>
            </form>
        </div>
    )
}

export default NewOrder;
