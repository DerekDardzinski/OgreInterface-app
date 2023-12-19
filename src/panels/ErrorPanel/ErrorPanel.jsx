import BaseCard from "../../components/BaseCard/BaseCard";

function ErrorPanel({title, message}) {
	return (
		<div className='md:col-span-2'>
			<BaseCard color='bg-error'>
				<div className='text-error-content flex justify-center items-center text-2xl font-bold'>
					{title}
				</div>
                <div className='text-error-content flex justify-center items-center text-center text-xl'>
					{message}
				</div>
			</BaseCard>
		</div>
	);
}

export default ErrorPanel;
