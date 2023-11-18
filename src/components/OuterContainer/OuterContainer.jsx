function OuterContainer(props) {
	return (
		<div className='h-full min-h-screen bg-base-100 scrollbar scrollbar-none'>
            {props.children}
		</div>
	);
}

export default OuterContainer;
