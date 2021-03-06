import React from 'react';
import {connect} from 'react-redux';

import ReactPlayer from 'react-player';
import SendBird from 'sendbird';

import SideBar from '../SideBar';
import Messages from './Messages';
import ProductList from '../ProductList';

/**
 * @desc Import constants
 */
import {
	INIT_CHAT,
	CHANGE_INPUT_CHAT,
	SAVE_MESSAGE,
	SHOW_SIDEBAR,
	GET_PRODUCT,
	ADD_ITEM_CART,
	UNMOUNT_VIDEO,
	CHANGE_BUTTON_STATE,
} from '../../constants/actionTypes';
import agent from '../../agent';
import {asynchat} from './asynchat';

const sb = new SendBird({appId: process.env.REACT_APP_SENDBIRD_ID});
/**
 * @function mapStateToProps
 * @param {*} state
 * @return {Object}
 */
const mapStateToProps = (state) => {
	return {
		...state.video,
		...state.common,
		idCart: state.cart.idCart,
		buttAddDisabled: state.cart.buttAddDisabled,
		nickname: state.common.userInfo ?
			state.common.userInfo.firstname+''+state.common.userInfo.lastname : null,
		usermail: state.common.userInfo ? state.common.userInfo.email : null,
	};
};

/**
 * @function mapDispatchToProps
 * @param {Object} dispatch
 * @param {Object} props
 * @return {*}
 */
const mapDispatchToProps = (dispatch, props) => ({
	/**
	 * @function getInfoChat
	 * @param {String} channel
	 * @param {String} cover
	 * @desc Set channel
	 * @return {*}
	 */
	initChat: (channel, cover) =>
		dispatch({type: INIT_CHAT, channel, cover}),

	/**
	 * @function getProduct
	 * @desc Get one product
	 * @return {*}
	 */
	getProduct: () =>
		dispatch({type: GET_PRODUCT, payload: agent.Products.getProduct([
			'VA15-SI-NA',
			'VT07-KH-XS',
			'VT09-KH-M'])}),

	/**
	 * @function changeInput
	 * @param {String} message
	 * @desc Change value of the input
	 * @return {*}
	 */
	changeInput: (message) =>
		dispatch({type: CHANGE_INPUT_CHAT, message}),

	/**
	 * @function saveMessage
	 * @param {String} message
	 * @desc Add a new message
	 * @return {*}
	 */
	saveMessage: (message) =>
		dispatch({type: SAVE_MESSAGE, message}),

	/**
	 * @function addCart
	 * @desc Save product in the cart
	 * @param {String} product
	 * @param {Integer} idCart
	 * @return {*}
	 */
	addCart: (product, idCart) =>
		dispatch({type: ADD_ITEM_CART,
			payload: agent.Cart.addItem(product.sku, idCart), product}),

	/**
	 * @function showSidebar
	 * @param {String} state Boolean
	 * @desc Change stat SideBar
	 * @return {*}
	 */
	showSidebar: (state) =>
		dispatch({type: SHOW_SIDEBAR, state}),

	/**
	 * @function changeButtState
	 * @return {*}
	 */
	changeButtState: () =>
		dispatch({type: CHANGE_BUTTON_STATE}),

	/**
	 * @function unmount
	 * @desc Clear data video
	 * @return {*}
	 */
	unmount: () =>
		dispatch({type: UNMOUNT_VIDEO}),
});

/**
 * @class Video
 */
class Video extends React.Component {
	/**
	 * @function constructor
	 */
	constructor() {
		super();
		this.state = {
			buttAddDisabled: false,
		};
		const that = this;
		this.openChannel = '';
		this.changeInput = (ev) => {
			this.props.changeInput(ev.target.value);
		};
		this.addCart = (product) => {
			this.setState({
				buttAddDisabled: true,
			});
			this.props.addCart(product, this.props.idCart);
		};
		this.changeButtState = () => {
			this.setState({
				buttAddDisabled: false,
			});
			this.props.changeButtState();
		};
		this.saveMessage = (ev) => {
			ev.preventDefault();

			this.openChannel.sendUserMessage(this.props.message,
				(message, error) => {
					if (error) {
						return;
					}

					that.props.saveMessage(message);
				});
		};
	}

	/**
	 * @function componentDidMount
	 * @desc Listener from SendBird to Save Messages.
	 */
	async componentDidMount() {
		const that = this;
		const ChannelHandler = new sb.ChannelHandler();

		await asynchat.messagereceived(ChannelHandler,
			that.props.saveMessage,
			that);
		sb.addChannelHandler('208549964', ChannelHandler);
	}

	/* eslint-disable*/
	/**
	 * @function componentWillMount
	 * @desc Get the products list, Connect in the chat.
	 */
	async componentWillMount() {
		const that = this;
		this.props.getProduct();
		
		if (this.props.nickname) {
			await asynchat.connect(this.props.nickname, this.props.usermail.split('@')[0], sb);
		} else {
			await asynchat.connect('anonymous', 'anonymous', sb);
		}
		
		this.openChannel = await asynchat.getchannel(sb, that.props.initChat);
	}
	/* eslint-enable*/

	/**
	 * @function componentWillUnmount
	 * @desc Disconnect user from Channel and SendBird. Clear data.
	 */
	async componentWillUnmount() {
		if (this.openChannel) {
			await asynchat.exit(this.openChannel);
		}
		sb.disconnect(() => {
		});

		this.props.unmount();
	}

	/**
	 * @function componentDidUpdate
	 * @desc Enable the button when add the item.
	 */
	componentDidUpdate() {
		if (this.props.buttAddDisabled && this.state.buttAddDisabled) {
			this.changeButtState();
		}
	};

	/**
	 * @function render
	 * @return {JSX} JSX del video
	 */
	render() {
		return (
			<article className="d-flex fullHeight">
				<SideBar
					showSidebar={this.props.showSidebar}
					stateSidebar={this.props.stateSidebar} />
				<section className="content-video d-flex w-100">
					<section
						className="video-displayer m-3 border rounded-bottom
							fit-content overflow-y-scroll">
						<ReactPlayer url='http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4'
							playing
							controls={true} />
						<section>
							<ProductList
								products={this.props.productsVideo}
								addCart={this.addCart}
								buttAddDisabled={this.state.buttAddDisabled}/>
						</section>
					</section>
					<section className="video-chat border">
						<Messages
							channel={this.props.channelName}
							cover={this.props.channelCover}
							messages={this.props.messages}
							saveMessage={this.saveMessage}
							changeInput={this.changeInput}
							message={this.props.message}
							buttDisabled={this.props.buttDisabled}
							nickname={this.props.nickname} />
					</section>
				</section>
			</article>
		);
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Video);
