import BaseCard from "../../components/BaseCard/BaseCard";

function TitlePanel({title}) {
	return (
		<div className='md:col-span-2'>
			<BaseCard color='bg-base-200'>
				<div className='flex justify-center items-center text-2xl font-bold'>
					{title}
				</div>
			</BaseCard>
		</div>
	);
}

export default TitlePanel;
