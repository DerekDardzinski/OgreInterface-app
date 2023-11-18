function InnerContainer(props) {
	return (
		<div className='flex items-top justify-center'>
			<div className='max-w-[100vh] flex-auto grid grid-cols-1 md:grid-cols-2 gap-4 py-6 px-2'>
				{props.children}
			</div>
		</div>
	);
}

export default InnerContainer;
