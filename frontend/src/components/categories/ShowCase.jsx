import {Typography} from "@heroui/react";

const ShowCase = ({title="product discovery"}) => {
  return(
      <section className={"container container-space"}>
          <div className="flex flex-row justify-between items-center mb-6 gap-4">
              <Typography type="h3"
                          className="text-2xl lg:text-4xl 2xl:text-5xl text-accent/80 uppercase font-bold tracking-tight">
                  {title}
              </Typography>
          </div>
          <div className={"w-full grid grid-cols-12 gap-4"}>

          </div>
      </section>
)
}

export default ShowCase